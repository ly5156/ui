import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get, set, computed, observer } from '@ember/object';
import { all } from 'rsvp';

export const headers = [
  {
    name:           'displayName',
    sort:           ['displayName'],
    searchField:    'displayName',
    translationKey: 'generic.name',
  },
  {
    name:           'namespace',
    sort:           ['namespace'],
    translationKey: 'generic.namespace',
  },
  {
    name:           'cidr',
    label:          'CIDR',
    sort:           ['cidr'],
    searchField:    'cidr',
    width:          150,
  },
  {
    name:           'master',
    label:          'Master',
    sort:           ['master'],
    searchField:    'master',
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
  availableActions: [
    {
      action:         'remove',
      icon:           'icon icon-trash',
      label:          'action.remove',
    },
  ],
  init() {
    this._super(...arguments);
    this.vlansubnetsDidChanged();
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
    promptDelete(data) {
      const clusterId = get(this, 'model.clusterId');

      const promises = data.map((d) => {
        return this.vlansubnet.removeVlansubnets(clusterId, d.name);
      });

      all(promises).then(() => {
        this.send('refreshModel');
      }).catch(() => {
        this.send('refreshModel');
      });
    },
    newVlansubent() {
      this.transitionToRoute('authenticated.cluster.vlansubnet.new');
    },
    handleMenuClick(command, data) {
      switch (command) {
      case 'remove':
        this.vlansubnet.removeVlansubnets(get(this, 'model.clusterId'), get(data, 'name')).then(() => {
          this.send('refreshModel');
        });
        break;
      }
    },
    selectChange(val) {
      set(this, 'ns', val);
    }
  },
  vlansubnetsDidChanged: observer('rows', function() {
    set(this, 'data', get(this, 'rows'));
  }),
  rows: computed('model.vlansubnets', function() {
    return get(this, 'model.vlansubnets');
  }),
})
