import { get, set, observer, computed } from '@ember/object';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import OptionallyNamespaced from 'shared/mixins/optionally-namespaced';
import layout from './template';
import  { PRESETS_BY_NAME } from  'ui/models/dockercredential';
import { inject as service } from '@ember/service';

export default Component.extend(ViewNewEdit, OptionallyNamespaced, {
  harbor: service(),
  layout,
  model:  null,

  titleKey: 'cruRegistry.title',

  scope:     'project',
  namespace: null,
  asArray:   null,

  projectType:    'dockerCredential',
  namespacedType: 'namespacedDockerCredential',

  harborAccount: null,
  harborServer:  null,

  init() {
    this._super(...arguments);

    set(this, 'asArray', JSON.parse(JSON.stringify(get(this, 'model.asArray') || [])));

    if (get(this, 'model.type') === 'namespacedDockerCredential') {
      set(this, 'scope', 'namespace');
    }
    // load harbor account
    get(this, 'harbor').loadHarborServerUrl().then((resp) => {
      set(this, 'harborServer', resp);
      get(this, 'harbor').fetchHarborUserInfo().then((resp) => {
        set(this, 'harborAccount', atob(resp.body.value));
      });
    });
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
      } else {
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

    if ( get(this, 'scope') !== 'project' ) {
      errors.pushObjects(get(this, 'namespaceErrors') || []);
    }
    set(this, 'errors', errors);

    return errors.length === 0;
  },

  doSave() {
    let self = this;
    let sup = self._super;

    return this.namespacePromise().then(() => sup.apply(self, arguments));
  },

  doneSaving() {
    this.sendAction('cancel');
  },
});
