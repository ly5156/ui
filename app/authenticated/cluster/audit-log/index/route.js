import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';

export default Route.extend({
  scope:      service(),
  auditLog:   service(),
  model() {
    const cluster = this.modelFor('authenticated.cluster');

    const logs = this.auditLog.fetchClusterAuditLogs(cluster.id).then((resp) => {
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
