import Controller from '@ember/controller';
import { observer, get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';


export default Controller.extend({
  harbor:                 service(),
  intl:                   service(),
  queryParams:            ['page', 'name'],
  page:                   1,
  searchText:             '',
  showAddUserModal:      false,
  modalVisible:          false,
  refreshFlag:           true,
  selectedRows:         [],
  initiallyOpened:       false,
  headers:                [
    {
      name:           'entity_name',
      translationKey: 'harborConfig.table.entityName',
      sort:            true,
    },
    {
      name:            'entity_type',
      translationKey: 'harborConfig.table.entityType',
      sort:            true,
    },
    {
      name:           'role_name',
      translationKey: 'harborConfig.table.role',
      sort:            true,
    }
  ],
  availableActions: [
    {
      action:   'remove',
      icon:     'icon icon-trash',
      label:    'action.remove',
    },
  ],
  actions:     {
    clearSearch() {
      set(this, 'name', '');
    },
    search(val) {
      set(this, 'name', val );
    },
    pageChange(page) {
      set(this, 'page', page)
    },
    selectChange(selected) {
      set(this, 'selectedRows', selected)
    },
    addUser() {
      set(this, 'showAddUserModal', true);
    },
    refresh() {
      this.send('refreshModel')
    },
    changeRole(roleId) {
      if (get(this, 'disableActions')){
        return;
      }
      const members = get(this, 'selectedMembersWithoutSelf').map((ele) => ele.id);

      if (members.length === 0) {
        return;
      }

      get(this, 'harbor').projectChangeRole(get(this, 'model.projectId'), members, { role_id: roleId }).then(() => {
        set(this, 'model.refreshFlag', false);
        this.send('refreshModel');
      }).catch(() => {
        set(this, 'model.refreshFlag', false);
        this.send('refreshModel');
      });
    },
    deleteMembersRole() {
      if (get(this, 'disableActions')){
        return;
      }
      set(this, 'showConfirmDeleteModal', true)
    },
    confirmDelete() {
      const members = get(this, 'selectedMembersWithoutSelf').map((ele) => ele.id);

      if (members.length === 0) {
        return;
      }
      get(this, 'harbor').projectDeleteMemberRole(get(this, 'model.projectId'), members).then(() => {
        set(this, 'showConfirmDeleteModal', false);
        this.transitionToRoute({ queryParams: { page: 1 } });
        this.send('refreshModel');
      }).catch(() => {
        set(this, 'model.refreshFlag', false);
        this.send('refreshModel');
      });
    },
    sortChanged(val) {
      const d = [...get(this, 'model.memberList.data')];
      let compare = function(obj1, obj2) {
        let a = obj1[val.sortBy];
        let b = obj2[val.sortBy];

        if ( a < b ) {
          return val.descending ? 1 : -1;
        } else if (a > b) {
          return val.descending ? -1 : 1;
        } else {
          return 0;
        }
      }

      set(this, 'model.memberList.data', d.sort(compare));
    }
  },
  nameChanged: observer('name', function() {
    set(this, 'searchText', get(this, 'name'));
  }),
  roleArr: computed('intl.locale', function() {
    const intl = get(this, 'intl');
    let arr = [
      {
        id:   1,
        name: intl.t('harborConfig.table.roleItem.admin')
      },
      {
        id:   2,
        name: intl.t('harborConfig.table.roleItem.developer')
      },
      {
        id:   3,
        name: intl.t('harborConfig.table.roleItem.visitor')
      }
    ];

    if (this.model.harborVersion.supportRoleMaster) {
      arr.push({
        id:   4,
        name: intl.t('harborConfig.table.roleItem.master')
      })
    }

    if (this.model.harborVersion.supportRoleLimitedGuest) {
      arr.push({
        id:   5,
        name: intl.t('harborConfig.table.roleItem.limitedGuest')
      })
    }

    return arr;
  }),
  selectedMembersWithoutSelf: computed('selectedRows.[]', function() {
    const currentUserId = get(this, 'model.currentUser.user_id');
    const members = get(this, 'selectedRows').filter((item) => item.entity_id !== currentUserId);

    return members;
  }),
  disableActions: computed('selectedRows.[]', function() {
    const selectedRows = get(this, 'selectedRows') || [];
    const hasProjectAdminRole = get(this, 'model.currentUser.has_admin_role') || `${ get(this, 'model.currentUserRoleId') }` === '1';
    const onlySelf = selectedRows.length === 1 && selectedRows[0].entity_type === 'u' && selectedRows[0].entity_id === get(this, 'model.currentUser.user_id');

    return !(selectedRows.length && hasProjectAdminRole) || onlySelf;
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
  isProjectMaster: computed('isSystemAdmin', 'model.currentUserRoleId', function() {
    if (get(this, 'isSystemAdmin')) {
      return true;
    } else {
      return get(this, 'model.currentUserRoleId') === '4';
    }
  }),
  isMember: computed('isSystemAdmin', 'model.currentUserRoleId', function() {
    if (get(this, 'isSystemAdmin')) {
      return true;
    } else {
      return parseInt(get(this, 'model.currentUserRoleId'), 10) > 0;
    }
  }),
  data: computed( 'model.memberList.data', function() {
    const rawData = get(this, 'model.memberList.data');

    return rawData;
  }),
});
