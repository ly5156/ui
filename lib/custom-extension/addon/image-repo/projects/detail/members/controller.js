import Controller from '@ember/controller';
import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';


export default Controller.extend({
  harbor:                 service(),
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
      label:          '姓名',
      sort:            true,
    },
    {
      name:            'entity_type',
      label:           '成员类型',
      sort:            true,
    },
    {
      name:           'role_name',
      label:          '角色',
      sort:            true,
    },
  ],
  roleArr:      [
    {
      id:   1,
      name: '项目管理员'
    },
    {
      id:   2,
      name: '开发人员'
    },
    {
      id:   3,
      name: '访客'
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
    search(val) {
      this.transitionToRoute({ queryParams: { name: val } });
    },
    pageChange(page) {
      this.transitionToRoute({ queryParams: { page } });
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
      get(this, 'harbor').projectChangeRole(get(this, 'model.projectId'), get(this, 'selectedRows').map((ele) => ele.id), { role_id: roleId }).then(() => {
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
      set(this, 'model.refreshFlag', false);
    },
    confirmDelete() {
      get(this, 'harbor').projectDeleteMemberRole(get(this, 'model.projectId'), get(this, 'selectedRows').map((ele) => ele.id)).then(() => {
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
  disableActions: computed('selectedRows.[]', function() {
    const selectedRows = get(this, 'selectedRows') || [];
    const hasProjectAdminRole = get(this, 'model.currentUser.has_admin_role');
    const onlySelf = selectedRows.length === 1 && selectedRows[0].entity_type === 'u' && selectedRows[0].entity_id === get(this, 'model.currentUser.user_id');

    return !(selectedRows.length && hasProjectAdminRole) || onlySelf;
  }),
  data: computed( 'model.memberList.data', function() {
    const rawData = get(this, 'model.memberList.data');

    return rawData;
  }),
});
