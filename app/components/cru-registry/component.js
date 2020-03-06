import { get, set, observer, computed } from '@ember/object';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import OptionallyNamespaced from 'shared/mixins/optionally-namespaced';
import layout from './template';
import  { PRESETS_BY_NAME } from  'ui/models/dockercredential';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { alias } from '@ember/object/computed';

export default Component.extend(ViewNewEdit, OptionallyNamespaced, {
  globalStore:  service(),
  clusterStore: service(),
  scopeService: service('scope'),
  harbor:       service(),

  layout,

  model:          null,
  titleKey:       'cruRegistry.title',
  scope:          'project',
  namespace:      null,
  asArray:        null,
  projectType:    'dockerCredential',
  namespacedType: 'namespacedDockerCredential',

  harborAccount: alias('harborConfig.harborAccount'),
  harborServer:  alias('harborConfig.harborServer'),

  init() {
    this._super(...arguments);

    if (get(this, 'model.type') === 'namespacedDockerCredential') {
      set(this, 'scope', 'namespace');
    }
    const globalRegistryEnabled = get(this, 'globalStore').all('setting').findBy('id', 'global-registry-enabled') || {};

    set(this, 'globalRegistryEnabled', get(globalRegistryEnabled, 'value') === 'true')

    let asArray = JSON.parse(JSON.stringify(get(this, 'model.asArray') || []))

    if (!globalRegistryEnabled && get(this, 'mode') === 'new') {
      asArray = asArray.map((item) => {
        if (item.preset === get(this, 'hostname')) {
          return {
            ...item,
            preset: 'custom'
          }
        }

        return item
      })
    }

    const isHarborCred = get(this, 'model.labels') && get(this, 'model.labels')['rancher.cn/registry-harbor-auth'] === 'true';

    if (isHarborCred) {
      asArray.forEach((item) => {
        item.preset = 'harbor';
      });
    }
    set(this, 'asArray', asArray);
    this.arrayChanged();
  },

  arrayChanged: observer('asArray.@each.{preset,address,username,password,auth}', function() {
    const registries = {};

    get(this, 'asArray').forEach((obj) => {
      const preset = get(obj, 'preset');
      let key = get(obj, 'address');

      if ( PRESETS_BY_NAME[preset] ) {
        key = PRESETS_BY_NAME[preset];
      }

      let val = {};

      if (preset === 'harbor' && get(this, 'hasHarborAccount')) {
        const [username, password] = get(this, 'harborAccount').split(':');

        val.username = username;
        val.password = password;
        key = get(this, 'harborServer');
        key = key.indexOf('://') > -1 ? key.substr(key.indexOf('://') + 3) : key;
        const labels = get(this, 'model.labels') || {};

        labels['rancher.cn/registry-harbor-auth'] = 'true';
        set(this, 'model.labels', labels);
      } else {
        const labels = get(this, 'model.labels');

        if (labels) {
          const keys = Object.keys(labels);

          if (keys.indexOf('rancher.cn/registry-harbor-auth') > -1) {
            if (keys.length === 1) {
              delete get(this, 'model').labels;
            } else {
              delete labels['rancher.cn/registry-harbor-auth'];
            }
          }
        }
        ['username', 'password', 'auth'].forEach((k) => {
          let v = get(obj, k);

          if ( v ) {
            val[k] = v;
          }
        });
      }

      registries[key] = val;
    });

    set(this, 'model.registries', registries);

    return this._super(...arguments);
  }),

  hasHarborAccount: computed('harborAccount', function() {
    return !!get(this, 'harborAccount');
  }),

  harborUsername: computed('harborAccount', function() {
    const account = get(this, 'harborAccount');

    if (!account) {
      return null;
    }

    return account.split(':')[0];
  }),

  hostname:  window.location.host,

  willSave() {
    let pr = get(this, 'primaryResource');

    // Namespace is required, but doesn't exist yet... so lie to the validator
    let nsId = get(pr, 'namespaceId');

    set(pr, 'namespaceId', '__TEMP__');
    let ok = this.validate();

    set(pr, 'namespaceId', nsId);

    return ok;
  },

  validate() {
    this._super();

    const errors = get(this, 'errors') || [];

    if ( get(this, 'scope') === 'namespace' && isEmpty(get(this, 'primaryResource.namespaceId')) ) {
      errors.pushObjects(get(this, 'namespaceErrors') || []);
    }
    set(this, 'errors', errors);

    return errors.length === 0;
  },

  doSave() {
    let self                       = this;
    let sup                        = self._super;
    const currentProjectsNamespace = get(this, 'clusterStore').all('namespace').findBy('projectId', get(this, 'scopeService.currentProject.id'));

    if (isEmpty(currentProjectsNamespace)) {
      return this.namespacePromise().then(() => sup.apply(self, arguments));
    } else {
      set(this, 'namespace', currentProjectsNamespace);

      return sup.apply(self, arguments);
    }
  },

  doneSaving() {
    if (this.done) {
      this.done();
    }
  },
});
