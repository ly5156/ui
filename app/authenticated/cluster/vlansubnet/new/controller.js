import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import Controller from '@ember/controller';
import CIDRMatcher from 'cidr-matcher';

const ipv4RegExp = /^(((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))$/;

export default Controller.extend({
  vlansubnet: service(),
  errors:     null,
  modes:      [
    {
      label: 'bridge',
      value: 'bridge',
    },
    // {
    //   label: 'private',
    //   value: 'private',
    // },
    // {
    //   label: 'vepa',
    //   value: 'vepa',
    // },
    // {
    //   label: 'passthru',
    //   value: 'passthru',
    // }
  ],
  form:       {
    apiVersion: 'macvlan.cluster.cattle.io/v1',
    kind:       'MacvlanSubnet',
    metadata:   {
      name:      '',
      namespace: 'kube-system'
    },
    spec: {
      master:  '',
      vlan:    2,
      cidr:    '',
      mode:    'bridge',
      gateway: '',
      ranges:  [],
    }
  },
  init() {
    this._super(...arguments);
    set(this, 'form', {
      apiVersion: 'macvlan.cluster.cattle.io/v1',
      kind:       'MacvlanSubnet',
      metadata:   {
        name:      '',
        namespace: 'kube-system'
      },
      spec: {
        master:  '',
        vlan:    '',
        cidr:    '',
        mode:    'bridge',
        gateway: '',
        ranges:  [],
      }
    });
  },
  actions: {
    save(cb) {
      if (!this.validate()) {
        cb(false);

        return;
      }
      const form = JSON.parse(JSON.stringify(get(this, 'form')));

      form.spec.vlan = parseInt(form.spec.vlan, 10) || 0;

      const clusterId = get(this, 'model.clusterId');
      const { master, vlan } = form.spec;

      this.hasVlan(master || '', vlan || 0).then((result) => {
        if (result) {
          set(this, 'errors', [`master为${ master }且vlan为${ vlan || '空' }, 已经存在`]);
          cb(false);

          return;
        }

        return this.vlansubnet.createVlansubnets(clusterId, form).then(() => {
          this.resetForm();
          cb(true);
          this.send('goToPrevious');
        });
      }).catch((err) => {
        if (err && err.body && err.body.message) {
          set(this, 'errors', [err.body.message]);
        }
        cb(false);
      });
    },
    cancel() {
      this.resetForm();
      this.send('goToPrevious');
    },
    addIPRange() {
      const ranges = get(this, 'form.spec.ranges').slice();

      ranges.push({
        rangeEnd:   '',
        rangeStart: '',
      });
      set(this, 'form.spec.ranges', ranges);
    },
    removeIPRange(obj) {
      const ranges = get(this, 'form.spec.ranges').filter((r) => r !== obj);

      set(this, 'form.spec.ranges', ranges);
    }
  },
  hasVlan(master, vlan) {
    const clusterId = get(this, 'model.clusterId');
    const q = [encodeURIComponent(`master=${ master }`), encodeURIComponent(`vlan=${ vlan }`)]
    const p = { labelSelector: q.join(',') };

    return this.vlansubnet.fetchVlansubnets(clusterId, p).then((resp) => {
      return resp.body.items.length > 0;
    });
  },
  resetForm() {
    set(this, 'form.metadata.name', '');
    set(this, 'form.metadata.namespace', '');
    set(this, 'form.spec.master', '');
    set(this, 'form.spec.vlan', '');
    set(this, 'form.spec.cidr', '');
    set(this, 'form.spec.mode', 'bridge');
    set(this, 'form.spec.gateway', '');
    set(this, 'form.spec.ranges', []);
  },
  validate() {
    const form = get(this, 'form');
    const errors = [];

    if (form.metadata.name === '') {
      errors.push('名称不能为空');
    }

    if (form.spec.master === '') {
      errors.push('master 不能为空');
    }

    if (form.spec.vlan !== '' && (!/^\d+$/.test(form.spec.vlan) || form.spec.vlan < 2 || form.spec.vlan > 4095)) {
      errors.push('VLAN值应该是2到4095之间的整数');
    }

    if (form.spec.cidr === '') {
      errors.push('CIDR 不能为空');
    }
    const cidrIPV4RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/\d{1,2}$/;

    if (form.spec.cidr !== '' && !cidrIPV4RegExp.test(form.spec.cidr)) {
      errors.push('CIDR格式错误');
    }

    if (form.spec.gateway && !ipv4RegExp.test(form.spec.gateway)) {
      errors.push('Gateway IP 格式错误');
    }
    if (form.spec.ranges.some((r) => !ipv4RegExp.test(r.rangeEnd) || !ipv4RegExp.test(r.rangeStart))) {
      errors.push('IP Ranges 中，存在IP地址格式不正确的记录');
    } else if (form.spec.ranges.some((r) => !this.ip4CIDRContains(form.spec.cidr, r.rangeEnd) || !this.ip4CIDRContains(form.spec.cidr, r.rangeStart))) {
      errors.push('IP Ranges 中，存在IP地址不在子网范围内的记录');
    }

    if (errors.length > 0) {
      set(this, 'errors', errors);

      return false;
    }
    set(this, 'errors', null);

    return true;
  },
  ip4CIDRContains(cidr, ip) {
    let result = false;

    try {
      const matcher = new CIDRMatcher([cidr]);

      result = matcher.contains(ip);
    } catch (err) {
      result = false;
    }


    return result;
  },
});
