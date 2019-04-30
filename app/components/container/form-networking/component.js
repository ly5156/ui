import { get, set, computed, observer } from '@ember/object';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';

export default Component.extend({
  scope:      service(),
  vlansubnet: service(),
  layout,
  // Inputs
  instance:   null,
  service:    null,
  errors:     null,
  editing:    null,

  // static pod
  staticPod:    false,

  staticPodForm: {
    network: 'static-macvlan-cni',
    cidr:      '',
    mac:     '',
    subnet:    '',
    podId:   '',
  },
  vlansubnets:          [],
  // unsupport vlansubnet
  unsupportVlansubnet:  true,
  initHostAliasesArray: [],
  initOptionsArray:     [],

  classNames: ['accordion-wrapper'],

  init() {
    this._super(...arguments);
    this.initHostAliases();
    this.initOptions();
    this.initStaticPod()
  },
  actions: {
    updateStaticPod() {
      const annotationsForm = get(this, 'staticPodForm');
      const annotations = get(this, 'service.annotations');
      const props = ['k8s.v1.cni.cncf.io/networks', 'cidr', 'mac', 'subnet', 'podId'];
      const propMap = {
        network: 'k8s.v1.cni.cncf.io/networks',
        cidr:    'cidr',
        mac:     'mac',
        subnet:  'subnet',
        podId:   'podId'
      };

      if (!get(this, 'enableStaticPod')) {
        if (annotations) {
          const form = {};

          Object.keys(annotations).forEach((a) => {
            if (props.indexOf(a) < 0) {
              form[a] = annotations[a];
            }
          });
          set(this, 'service.annotations', Object.assign({}, form));
        }

        return;
      }
      const { network, subnet } = annotationsForm;

      if (network && subnet) {
        const form = {};

        Object.keys(annotationsForm).forEach((a) => {
          form[propMap[a]] = annotationsForm[a];
          if (a === 'cidr' && annotationsForm[a] === '') {
            form[propMap[a]] = 'auto';
          }
        });

        set(this, 'service.annotations', Object.assign({}, annotations || {}, form));

        return;
      }
    },
    hostAliasesChanged(hostAliases) {
      const out = [];

      hostAliases.filter((alias) => alias.value && alias.key).forEach((alias) => {
        out.push({
          hostnames: [alias.value],
          cidr:        alias.key,
        });
      });
      set(this, 'service.hostAliases', out);
    },

    optionsChanged(options) {
      const out = [];

      options.filter((option) => get(option, 'key') && get(option, 'value')).forEach((option) => {
        out.push({
          name:  get(option, 'key'),
          value: get(option, 'value'),
        });
      });

      const dnsConfig = get(this, 'service.dnsConfig');

      if ( !dnsConfig ) {
        set(this, 'service.dnsConfig', { options: out });
      } else {
        set(this, 'service.dnsConfig.options', out);
      }
    },

    updateNameservers(nameservers) {
      const dnsConfig = get(this, 'service.dnsConfig');

      if ( !dnsConfig ) {
        set(this, 'service.dnsConfig', { nameservers });
      } else {
        set(this, 'service.dnsConfig.nameservers', nameservers);
      }
    },

    updateSearches(searches) {
      const dnsConfig = get(this, 'service.dnsConfig');

      if ( !dnsConfig ) {
        set(this, 'service.dnsConfig', { searches });
      } else {
        set(this, 'service.dnsConfig.searches', searches);
      }
    }
  },

  namespaceDidChanged: observer('service.namespaceId', function() {
    const clusterId = get(this, 'scope.currentCluster.id');

    if (clusterId) {
      get(this, 'vlansubnet').fetchVlansubnets(clusterId).then((resp) => {
        const items = resp.body.items.map((item) => ({
          label: item.metadata.name,
          value: item.metadata.name
        }));

        set(this, 'vlansubnets', items);
        set(this, 'unsupportVlansubnet', false);
      });
    }
  }),
  staticPodDidChanged: observer('staticPod', function() {
    if (get(!this, 'staticPod')) {
      const annotations = get(this, 'service.annotations') || {};
      const props = ['k8s.v1.cni.cncf.io/networks', 'cidr', 'mac', 'subnet', 'podId'];
      const form = {}

      Object.keys(annotations).forEach((a) => {
        if (props.indexOf(a) < 0) {
          form[a] = annotations[a];
        }
      });

      set(this, 'service.annotations', form);

      return;
    }
    this.send('updateStaticPod');
  }),
  staticPodAnnotation: computed('service.annotations.{k8s.v1.cni.cncf.io/networks,static-ip,static-mac,vlan}', function() {
    const annotations = get(this, 'service.annotations') || {};

    return {
      network: annotations['k8s.v1.cni.cncf.io/networks'],
      cidr:    annotations.cidr,
      mac:     annotations.mac,
      subnet:  annotations.subnet,
      podId:   annotations.podId,
    }
  }),
  enableStaticPod: computed('service.annotations.{k8s.v1.cni.cncf.io/networks,static-ip,static-mac,vlan}', 'staticPod', 'editing', function() {
    const {
      'k8s.v1.cni.cncf.io/networks': network, cidr, subnet
    } = get(this, 'service.annotations') || {};

    if (get(this, 'editing')) {
      return get(this, 'staticPod')
    }
    if (network && cidr && subnet) {
      return true;
    }

    return false;
  }),
  enableStaticPodLabel: computed('enableStaticPod', function() {
    if (get(this, 'enableStaticPod')) {
      return '启用';
    }

    return '禁用';
  }),
  vlansubnetdisabledStyle: computed('unsupportVlansubnet', function() {
    if (get(this, 'unsupportVlansubnet')) {
      return 'color: #8b969d;cursor: not-allowed;';
    }

    return '';
  }),
  initHostAliases() {
    const aliases = get(this, 'service.hostAliases');

    set(this, 'initHostAliasesArray', []);
    (aliases || []).forEach((alias) => {
      (alias.hostnames || []).forEach((hostname) => {
        get(this, 'initHostAliasesArray').push({
          key:   alias.ip,
          value: hostname,
        });
      })
    });
  },

  initOptions() {
    const options = get(this, 'service.dnsConfig.options');

    set(this, 'initOptionsArray', []);
    (options || []).forEach((option) => {
      get(this, 'initOptionsArray').push({
        key:   get(option, 'name'),
        value: get(option, 'value'),
      });
    });
  },
  initStaticPod() {
    const annotations = get(this, 'service.annotations') || {};
    const {
      'k8s.v1.cni.cncf.io/networks': network, cidr, mac, subnet, podId
    } = annotations || {};

    if (network && subnet) {
      set(this, 'staticPod', true);
      set(this, 'staticPodForm', {
        network,
        cidr: cidr === 'auto' ? '' : cidr,
        mac,
        subnet,
        podId,
      })
    } else {
      set(this, 'staticPodForm', {
        network: 'static-macvlan-cni',
        cidr:    '',
        mac:     '',
        subnet:  '',
        podId:   '',
      })
    }
    this.namespaceDidChanged();
  }
});
