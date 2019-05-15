import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get, set, computed, observer } from '@ember/object';
import { all } from 'rsvp';

export const headers = [
  {
    name:           'userID',
    label:          '操作人',
    sort:           ['userID'],
    searchField:    'userID',
  },
  {
    name:           'requestTimestamp',
    label:          '变更时间',
    sort:           ['clusterId'],
    searchField: 'requestTimestamp',
  },
  {
    name:           'clusterId',
    label:          '集群',
    sort:           ['clusterId'],
    searchField:    'clusterId',
  },
  {
    name:           'requestResType',
    label:          '资源类型',
    sort:           ['requestResType'],
    searchField:    'requestResType',
  },
  {
    name:           'requestResId',
    label:          '资源ID',
    sort:           ['requestResId'],
    searchField:    'requestResId',
  },
];

export default Controller.extend({
  auditLog:         service(),
  scope:            service(),
  router:           service(),
  session:          service(),
  sortBy:           'clusterId',
  headers,
  data:             [],
  availableActions: [],
  actions:          {
    search(val) {

    },
    sortChanged(sort) {

    },
  },
  rows: computed('model.logs.data', function() {
    return get(this, 'model.logs.data');
  }),
})
