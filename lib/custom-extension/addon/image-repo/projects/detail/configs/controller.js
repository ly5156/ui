import Controller from '@ember/controller';
import { get, set, computed } from '@ember/object'
import { inject as service } from '@ember/service';

export default Controller.extend({
  harbor:                 service(),
  saveDisabled:           false,
  cancelDisabled:         false,
  saving:                 false,
  actions:                {
    savePublicConfig() {
      let params = {};

      Object.assign(params, get(this, 'model.config.metaData'))
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
      set(this, 'model.config.metaData.public', !get(this, 'model.config.metaData.public'))
    },
  },
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