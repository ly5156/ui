import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  vlansubnet:  service(),

  model(params) {
    const cluster = this.modelFor('authenticated.cluster');
    const subnet = params.subnet

    return this.vlansubnet.fetchMacvlanIp(cluster.id).then((p) => {
      let rawData = p.body.items;

      if (subnet) {
        rawData = rawData.filter((d) => d.spec.subnet.indexOf(subnet) > -1);
      }
      const data = rawData.map((d) => {
        return {
          creationTimestamp: d.metadata.creationTimestamp,
          name:              d.metadata.name,
          displayName:       d.metadata.name,
          namespace:         d.metadata.namespace,
          id:                d.metadata.uid,
          ip:                d.spec.ip,
          mac:               d.spec.mac,
          podId:             d.spec['pod-id'],
          subnet:            d.spec.subnet,
        };
      });

      return {
        cluster,
        macvlanIps: data,
        rawData:    p.body.items,
      }
    });
  },
  queryParams: { subnet: { refreshModel: true } },
});
