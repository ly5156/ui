import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get, set, computed, observer } from '@ember/object';

export const headers = [
  {
    name:           'userID',
    label:          '操作人',
    searchField:    'userID',
  },
  {
    name:           'requestTimestamp',
    label:          '变更时间',
    sort:           ['requestTimestamp'],
    searchField: 'requestTimestamp',
  },
  {
    name:           'clusterID',
    label:          '集群',
    searchField:    'clusterID',
  },
  {
    name:           'requestResType',
    label:          '资源类型',
    searchField:    'requestResType',
  },
  {
    name:           'requestResId',
    label:          '资源ID',
    searchField:    'requestResId',
  },
];

export default Controller.extend({
  auditLog:         service(),
  scope:            service(),
  prefs:            service(),
  router:           service(),
  session:          service(),
  modalService:     service('modal'),
  sortBy:           'requestTimestamp',
  dateRanges:       [
    {
      label: '日志时间-全部',
      value: '-1',
    },
    {
      label: '最近5天',
      value: '5',
    },
    {
      label: '最近10天',
      value: '10',
    },
    {
      label: '最近15天',
      value: '15',
    }
  ],
  operations: [
    {
      label: '所有操作',
      value: ''
    },
    {
      label: '创建',
      value: 'Create'
    },
    {
      label: '更新',
      value: 'Update'
    },
    {
      label: '删除',
      value: 'Delete'
    }
  ],
  searchFields: [
    // {
    //   label: 'userID',
    //   value: 'userID',
    // },
    {
      label: 'requestResId',
      value: 'requestResId',
    },
    {
      label: 'requestResType',
      value: 'requestResType',
    },
  ],
  headers,
  data:             [],
  availableActions: [],
  loading:          false,
  form:             {
    field:          'requestResId',
    fieldValue:     '',
    next:           '',
    operation:      '',
    dateRange:     -1,
    order:          '',
  },
  queryForm: {},
  actions:          {
    showDetail(log) {
      get(this, 'modalService').toggleModal('modal-audit-log-detail', {
        escToClose: true,
        resource:   log
      });
    },
    search() {
      this.syncForm();
      const q = get(this, 'queryForm');
      const loading = get(this, 'loading');

      if (loading) {
        return
      }
      this.auditLog.fetchRancherAuditLogs(q).then((resp) => {
        set(this, 'model.logs', resp.body);
        set(this, 'loading', false);
      }).catch(() => {
        set(this, 'loading', false);
      });
    },
    clear() {
      this.resetForm();
      this.send('search');
    },
    pageChange(next) {
      if (get(this, 'loading')) {
        return;
      }
      const pagesize = get(this, 'prefs.tablePerPage');
      const q = {
        pagesize,
        next
      };

      this.auditLog.fetchRancherAuditLogs(q).then((resp) => {
        set(this, 'loading', false);
        const data = [...get(this, 'model.logs.data')];

        data.push(...resp.body.data);

        set(this, 'model.logs', Object.assign({}, resp.body, { data }));
      }).catch(() => {
        set(this, 'loading', false);
      });
    },
    sortChanged(sort) {
      const loading = get(this, 'loading');

      if (loading) {
        return
      }
      set(this, 'loading', true);
      const clusterId = get(this, 'scope.currentCluster.id');

      set(this, 'queryForm.order', sort.descending ? 'desc' : 'asc');
      const q = get(this, 'queryForm');

      this.auditLog.fetchClusterAuditLogs(clusterId, q).then((resp) => {
        set(this, 'model.logs', resp.body);
        set(this, 'loading', false);
      }).catch(() => {
        set(this, 'loading', false);
      });
    },
  },
  rows: computed('model.logs.data', function() {
    return get(this, 'model.logs.data');
  }),
  fieldPlaceholder: computed('form.field', function() {
    const f = get(this, 'form.field');
    const fields = get(this, 'searchFields');

    return fields.find((item) => item.value === f).label;
  }),
  next: computed('model.logs.pagination.next', function() {
    return !!get(this, 'model.logs.pagination.next');
  }),
  syncForm() {
    const f = get(this, 'form');
    const pagesize = get(this, 'prefs.tablePerPage');
    const q = { pagesize };

    if (f.field && f.fieldValue) {
      q[f.field] = f.fieldValue;
    }

    const dateRange = parseInt(f.dateRange, 10);

    if (dateRange > 0) {
      const d = new Date();

      q.to = `${ d.toISOString().split('.')[0] }Z`;
      d.setDate(d.getDate() - dateRange);
      q.from = `${ d.toISOString().split('.')[0] }Z`
    }
    if (f.operation) {
      q.operation = f.operation;
    }
    set(this, 'queryForm', q);
  },
  resetForm() {
    const pagesize = get(this, 'prefs.tablePerPage');

    set(this, 'queryForm', { pagesize });
    set(this, 'form', {
      field:          'requestResId',
      fieldValue:     '',
      next:           '',
      operation:      '',
      dateRange:     -1,
      order:          '',
    });
  },
})
