import Controller from '@ember/controller';
import { get, set, computed, observer } from '@ember/object'
import { inject as service } from '@ember/service';

export default Controller.extend({
  harbor:                 service(),
  saveDisabled:           false,
  cancelDisabled:         false,
  saving:                 false,
  config:                 {},
  actions:                {
    savePublicConfig() {
      let params = {};

      Object.assign(params, get(this, 'config'))
      params.public ? params.public = 'true' : params.public = 'false';
      get(this, 'harbor').setProjectPublic( { metadata: params }, get(this, 'model.projectId')).then(() => {
        set(this, 'saving', false)
        this.send('refreshModel');
      }).catch(() => {
        set(this, 'saving', false)
        this.send('refreshModel');
      })
    },
    cancelPublicConfig() {
      this.configChanged();
    },
  },
  configChanged: observer('model.config', function() {
    const metaData = Object.assign({}, get(this, 'model.config'));

    if (metaData.public === 'false') {
      metaData.public = false;
    } else {
      metaData.public = true;
    }
    set(this, 'config', metaData);
  }),
  isSystemAdmin: computed('model.currentUser', function() {
    return get(this, 'model.currentUser.has_admin_role');
  }),
  isProjectAdmin: computed('isSystemAdmin', 'model.currentUserRoleId', function() {
    if (get(this, 'isSystemAdmin')) {
      return true;
    } else {
      return get(this, 'model.currentUserRoleId') === '1';
    }
  }),
  isMember: computed('isSystemAdmin', 'model.currentUserRoleId', function() {
    if (get(this, 'isSystemAdmin')) {
      return true;
    } else {
      return parseInt(get(this, 'model.currentUserRoleId'), 10) > 0;
    }
  }),
});