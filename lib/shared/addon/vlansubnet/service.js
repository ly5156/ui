
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  globalStore:    service(),
  harborServer:   '',
  access:         service(),
  fetchVlansubnets(cluster) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets`,
      method: 'GET',
    });
  },
  removeVlansubnets(cluster, subnet) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets/${ subnet }`,
      method: 'DELETE',
    });
  },
  createVlansubnets(cluster, params) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets`,
      method: 'POST',
      data:   params,
    });
  },
  fetchMacvlanIp(cluster, p = {}) {
    const q = Object.entries(p).map((item) => `${ item[0] }=${ item[1] }`).join('&');

    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/macvlanips${ q ? `?${ q }` : '' }`,
      method: 'GET',
    });
  },
});