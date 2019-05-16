import Service, { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';

export default Service.extend({
  globalStore:    service(),
  access:         service(),
  settings:       service(),
  auditLogServer: computed('settings', function() {
    var all = get(this, 'settings.asMap');

    return `http://${ all['auditlog-server'] && all['auditlog-server']['value'] }`;
  }),

  fetchClusterAuditLogs(clusterID, params = {}) {
    const query = Object.entries(params).map((e) => `${ e[0] }=${ e[1] }`).join('&');

    return get(this, 'globalStore').rawRequest({ url: `/meta/auditlog/${ get(this, 'auditLogServer').replace('//', '/') }/v1/auditlogs?clusterID=${ clusterID }&${ query }` });
  },
  fetchWorkloadAuditLogs(clusterID, workloadId, params) {
    const query = Object.entries(params).map((e) => `${ e[0] }=${ e[1] }`).join('&');

    return get(this, 'globalStore').rawRequest({ url: `/meta/auditlog/${ get(this, 'auditLogServer').replace('//', '/') }/v1/auditlogs?clusterID=${ clusterID }&requestResId=${ workloadId }&requestResType=workload&${ query }` });
  },
  fetchRancherAuditLogs(params) {
    const query = Object.entries(params).map((e) => `${ e[0] }=${ e[1] }`).join('&');

    return get(this, 'globalStore').rawRequest({ url: `/meta/auditlog/${ get(this, 'auditLogServer').replace('//', '/') }/v1/auditlogs?&${ query }` });
  }
});