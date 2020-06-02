import { get, set, observer, computed } from '@ember/object';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import OptionallyNamespaced from 'shared/mixins/optionally-namespaced';
import layout from './template';
import  { PRESETS_BY_NAME } from  'ui/models/dockercredential';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { alias } from '@ember/object/computed';
const harborAuthKey = 'rancher.cn/registry-harbor-auth'
const harborAdminAuthKey = 'rancher.cn/registry-harbor-admin-auth'

const TEMP_NAMESPACE_ID = '__TEMP__';

export default Component.extend(ViewNewEdit, OptionallyNamespaced, {
  globalStore:  service(),
  clusterStore: service(),
  scopeService: service('scope'),
  harbor:       service(),
  access:       service(),

  layout,

  model:          null,
  titleKey:       'cruRegistry.title',
  scope:          'project',
  namespace:      null,
  asArray:        null,
  projectType:    'dockerCredential',
  namespacedType: 'namespacedDockerCredential',

  harborUsername: alias('harborConfig.harborAccount'),
  harborServer:   alias('harborConfig.harborServer'),

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

    const isHarborCred = get(this, 'model.labels') && get(this, 'model.labels')[harborAuthKey] === 'true';

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

      if (preset === 'harbor' && this.enabledHarborService) {
        key = get(this, 'harborServer');
        key = key.indexOf('://') > -1 ? key.substr(key.indexOf('://') + 3) : key;
        const labels = get(this, 'model.labels') || {};

        labels[harborAuthKey] = 'true';
        if (get(this, 'access.me.hasAdmin')) {
          labels[harborAdminAuthKey] = 'true';
        }
        set(this, 'model.labels', labels);
      } else {
        const labels = get(this, 'model.labels');

        if (labels) {
          const keys = Object.keys(labels);

          if (keys.indexOf(harborAuthKey) > -1) {
            delete labels[harborAuthKey];
          }
          if (keys.indexOf(harborAdminAuthKey) > -1) {
            delete labels[harborAdminAuthKey]
          }
          if (Object.keys(labels).length === 0) {
            delete get(this, 'model').labels
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

  enabledHarborService: computed('harborServer', 'access.me.hasAdmin', 'access.me.annotations', function() {
    if (get(this, 'harborServer')) {
      if (get(this, 'access.me.hasAdmin')) {
        return true;
      }
      const a = get(this, 'access.me.annotations')

      if (a && a['management.harbor.pandaria.io/synccomplete'] === 'true') {
        return true;
      }
    }

    return false;
  }),

  hostname:  window.location.host,

  willSave() {
    const { primaryResource: pr } = this;
    const nsId = this.namespace && this.namespace.id;

    set(pr, 'namespaceId', nsId ? nsId : TEMP_NAMESPACE_ID);

    let ok = this.validate();

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

    if (get(this, 'isClone')) {
      set(this, 'namespace', get(this, 'model.namespace'));
    }
    const { primaryResource: { namespaceId } } = this;

    if (isEmpty(namespaceId) || namespaceId === TEMP_NAMESPACE_ID) {
      return this.namespacePromise().then(() => sup.apply(self, arguments));
    } else {
      return sup.apply(self, arguments);
    }
  },

  doneSaving() {
    if (this.done) {
      this.done();
    }
  },
});
