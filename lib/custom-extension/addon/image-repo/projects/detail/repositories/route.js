import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  harbor:       service(),
  access:       service(),
  globalStore:  service(),
  prefs:        service(),
  harborServer:       '',
  beforeModel() {
    this._super(...arguments);
    let harborServer = null;

    harborServer = get(this, 'harbor').loadHarborServerUrl().then((resp) => {
      set(this, 'harborServer', resp);
    });

    return hash({ harborServer });
  },
  model(params) {
    const page = params.page || 1;
    let imageList = null;
    let imageInformation = null;
    let harborServerArr = [];
    let harborServerIp = '';
    const pageSize = get(this, 'prefs.tablePerPage');

    harborServerArr = get(this, 'harborServer').split('//');
    harborServerIp = harborServerArr.length ? harborServerArr[1] : '';
    imageInformation = get(this, 'harbor').getProjectDetail(params.project_id).then((resp) => {
      let tag = `docker tag SOURCE_IMAGE[:TAG] ${ harborServerIp }/${ resp.body.name }/IMAGE[:TAG]`;
      let push = `docker push ${ harborServerIp }/${ resp.body.name }/IMAGE[:TAG]`

      return {
        tag,
        push,
        name: resp.body.name
      };
    })

    const p = {
      page,
      page_size:   pageSize,
      project_id:  params.project_id,
    };

    if (params.name) {
      p.q = params.name
    }
    imageList = get(this, 'harbor').fetchProjectImages(p).then((resp) => {
      const data = resp.body;

      data.forEach((item) => {
        item.displayName = item.name;
      });

      return {
        data,
        totalCount: parseInt(resp.headers.map['x-total-count'] || 0),
        projectId:  params.project_id
      };
    });
    const currentUser = get(this, 'harbor').fetchCurrentHarborUser().then((resp) => resp.body);

    return hash({
      imageList,
      imageInformation,
      currentUser,
      currentUserRoleId: params.current_user_role_id
    });
  },
  actions: {
    refreshModel() {
      this.refresh();
    }
  },
  queryParams: {
    page:       { refreshModel: true },
    name:       { refreshModel: true },
  },
});