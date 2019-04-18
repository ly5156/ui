import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get, set, computed, observer } from '@ember/object';


const headers = [
  {
    name:           'dname',
    sort:           ['name'],
    searchField:    'name',
    translationKey: 'generic.name',
  },
  {
    name:           'namespace',
    sort:           ['namespace'],
    searchField:    'namespace',
    translationKey: 'generic.namespace',
  },
  {
    name:           'ip',
    label:          'IP',
    sort:           ['ip'],
    searchField:    'ip',
    width:          150,
  },
  {
    name:           'mac',
    label:          'MAC',
    sort:           ['mac'],
    searchField:    'mac',
  },
  {
    name:           'podId',
    label:          'Pod ID',
    sort:           ['podId'],
    searchField:    'podId',
  },
  {
    name:           'vlan',
    label:          'VLAN',
    sort:           ['vlan'],
    searchField:    'vlan',
  },
  {
    classNames:     'text-right pr-20',
    name:           'creationTimestamp',
    label:          '创建时间',
    searchField:    false,
    width:          250,
  },
];

export default Controller.extend({
  vlansubnet:       service(),
  scope:            service(),
  router:           service(),
  session:          service(),

  sortBy:           'name',
  headers,
  data:             [],
  searchText:       '',
  availableActions: [],
  init() {
    this._super(...arguments);
    this.staticPodsDidChanged();
  },
  actions: {
    search(val) {
      if (!val) {
        set(this, 'data', get(this, 'rows'));

        return;
      }
      const data = get(this, 'rows') || [];

      const result = data.filter((d) => {
        return d.displayName.indexOf(val) > -1
          || d.namespace.indexOf(val) > -1
          || d.cidr.indexOf(val) > -1
          || d.master.indexOf(val) > -1;
      });

      set(this, 'data', result);
    },
    sortChanged(sort) {
      const data = [...get(this, 'model.vlansubnets')];

      data.sort((a, b) => {
        if (a[sort.sortBy] > b[sort.sortBy]) {
          return sort.descending ? 1 : -1;
        }
        if (a[sort.sortBy] < b[sort.sortBy]) {
          return sort.descending ? -1 : 1;
        }

        return 0;
      });
      set(this, 'data', data);
    },
  },
  staticPodsDidChanged: observer('rows', function() {
    set(this, 'data', get(this, 'rows'));
  }),
  rows: computed('model.staticPods', function() {
    return get(this, 'model.staticPods');
  }),
});
