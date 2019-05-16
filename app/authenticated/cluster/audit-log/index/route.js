import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';
import { get } from '@ember/object';

export default Route.extend({
  scope:      service(),
  auditLog:   service(),
  prefs:      service(),
  model() {
    const clusterId = get(this, 'scope.currentCluster.id');
    const pagesize = get(this, 'prefs.tablePerPage');
    const logs = this.auditLog.fetchClusterAuditLogs(clusterId, { pagesize }).then((resp) => {
      return resp.body;
    });

    return hash({ logs });
  },
  actions: {
    refreshModel() {
      this.refresh();
    }
  },
});
