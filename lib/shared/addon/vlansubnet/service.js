
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  globalStore:    service(),
  access:         service(),
  fetchVlansubnets(cluster, p = {}) {
    const q = Object.entries(p).map((e) => `${ e[0] }=${ e[1] }`).join('&');

    return get(this, 'globalStore').rawRequest({
      url:    `/k8s/clusters/${ cluster }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets${ q ? `?${ q }` : '' }`,
      method: 'GET',
    }).then((resp) => {
      resp.body.data = resp.body.items.map((item) => {
        return {
          id:                item.metadata.uid,
          name:              item.metadata.name,
          displayName:        item.metadata.name,
          namespace:         item.metadata.namespace,
          master:            item.spec.master,
          vlan:              item.spec.vlan,
          cidr:              item.spec.cidr,
          mode:              item.spec.mode,
          gateway:           item.spec.gateway,
          creationTimestamp: item.metadata.creationTimestamp,
          ipRanges:          item.spec.ranges.map((item) => `${ item.rangeStart }-${ item.rangeEnd }`).join(','),
          rawData:           item,
        };
      });

      return resp;
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
    }).then((resp) => {
      resp.body.data = resp.body.items.map((d) => {
        return {
          creationTimestamp: d.metadata.creationTimestamp,
          name:              d.metadata.name,
          displayName:       d.metadata.name,
          namespace:         d.metadata.namespace,
          id:                d.metadata.uid,
          cidr:              d.spec.cidr,
          mac:               d.spec.mac,
          podId:             d.spec.podId,
          subnet:            d.spec.subnet,
        };
      });

      return resp;
    });
  },
});