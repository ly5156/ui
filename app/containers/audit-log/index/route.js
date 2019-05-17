import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';
import { get } from '@ember/object';

export default Route.extend({
  scope:      service(),
  auditLog:   service(),
  prefs:      service(),
  model(params) {
    const clusterId = get(this, 'scope.currentCluster.id') || params.clusterId;
    const workloadId = params.workloadId;
    const pagesize = get(this, 'prefs.tablePerPage');
    const logs = this.auditLog.fetchWorkloadAuditLogs(clusterId, workloadId, { pagesize }).then((resp) => {
      return resp.body;
    });

    return hash({ logs });
  },
  actions: {
    refreshModel() {
      this.refresh();
    }
  },
  queryParams: {
    workloadId: { refreshModel: true },
    clusterId:  { refreshModel: true }
  },
});
