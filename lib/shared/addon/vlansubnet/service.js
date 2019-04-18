
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  globalStore:    service(),
  harborServer:   '',
  access:         service(),
  fetchVlansubnets(cluster) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/staticmacvlan.rancher.com/v1/namespaces/kube-system/vlansubnets`,
      method: 'GET',
    });
  },
  removeVlansubnets(cluster, subnet) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/staticmacvlan.rancher.com/v1/namespaces/kube-system/vlansubnets/${ subnet }`,
      method: 'DELETE',
    });
  },
  createVlansubnets(cluster, params) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/staticmacvlan.rancher.com/v1/namespaces/kube-system/vlansubnets`,
      method: 'POST',
      data:   params,
    });
  },
  fetchStaticPods(cluster) {
    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/staticmacvlan.rancher.com/v1/staticpods`,
      method: 'GET',
    });
  },
});