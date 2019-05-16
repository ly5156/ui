import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  scope:      service(),
  vlansubnet: service(),
  prefs:      service(),

  model() {
    const clusterId = get(this, 'scope.currentCluster.id');
    const p = { limit: get(this, 'prefs.tablePerPage') };
    const vlansubnets = get(this, 'vlansubnet').fetchVlansubnets(clusterId, p).then((resp) => {
      return {
        data:     resp.body.data.map((item) => {
          item.displayName = item.name;

          return item;
        }),
        continue: resp.body.metadata.continue,
      };
    });

    return hash({
      vlansubnets,
      clusterId,
    });
  },
  actions: {
    error(err) {
      // unsupport vlansubnet
      if ( err && err.status ) {
        this.transitionTo('authenticated.cluster.vlansubnet.unsupport');

        return false;
      } else {
        // Bubble up
        return true;
      }
    },
    refreshModel() {
      this.refresh();
    }
  },
});
