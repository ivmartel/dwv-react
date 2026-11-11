import { vi } from 'vitest';

// mock dwv: only the classes used by the annotation service
vi.mock('dwv', () => {
  class DrawController {
    static instances = [];
    constructor(group) {
      this.group = group;
      DrawController.instances.push(this);
    }
    updateAnnotationWithCommand = vi.fn();
    removeAnnotationWithCommand = vi.fn();
  }
  return {
    DrawController,
    AnnotationGroupFactory: class {},
    DicomWriter: class {},
    getUID: () => '1.2.3',
    logger: {warn: vi.fn()}
  };
});

import { DrawController } from 'dwv';
import { AnnotationService } from './AnnotationService.js';

/**
 * Create a fake dwv annotation.
 *
 * @param {string} id The tracking UID.
 * @param {object} [props] Optional properties.
 * @returns {object} The annotation.
 */
const fakeAnnotation = (id, props = {}) => ({
  trackingUid: id,
  trackingId: 'label-' + id,
  colour: '#ffff80',
  quantification: undefined,
  getFactory: () => ({getName: () => 'circle'}),
  canView: () => true,
  getCentroid: () => ({x: 1}),
  ...props
});

/**
 * Create a fake dwv annotation group.
 *
 * @param {object[]} list The annotations.
 * @returns {object} The group.
 */
const fakeGroup = (list = []) => {
  let editable = true;
  return {
    list,
    getList: () => list,
    find: (id) => list.find((item) => item.trackingUid === id),
    isEditable: () => editable,
    setEditable(flag) {
      editable = flag;
      for (const listener of this.listeners) {
        listener({type: 'annotationgroupeditablechange', data: flag});
      }
    },
    listeners: new Set(),
    addEventListener(_type, listener) {
      this.listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      this.listeners.delete(listener);
    }
  };
};

/**
 * Create a fake dwv app service.
 *
 * @returns {object} The service.
 */
const fakeDwvAppService = () => {
  const service = new EventTarget();
  service.data = {};
  service.drawLayer = {
    setAnnotationVisibility: vi.fn(),
    setLabelsVisibility: vi.fn(),
    setCurrentPosition: vi.fn()
  };
  service.getData = (dataId) => service.data[dataId];
  service.getDrawLayersByDataId = () => [service.drawLayer];
  service.getMainLayerGroupDivId = () => 'layerGroup0';
  service.getLayerGroupByDivId = vi.fn();
  service.addToUndoStack = vi.fn();
  service.createAnnotationData = vi.fn(() => ({}));
  service.addAndRenderAnnotationData = vi.fn();
  service.fire = (type, detail) => {
    service.dispatchEvent(new CustomEvent(type, {detail}));
  };
  return service;
};

const setup = () => {
  const dwvAppService = fakeDwvAppService();
  const service = new AnnotationService(dwvAppService);
  service.connect();
  const group = fakeGroup([fakeAnnotation('a0')]);
  dwvAppService.data['1'] = {annotationGroup: group};
  dwvAppService.fire('dataadd', {dataid: '1'});
  return {dwvAppService, service, group};
};

describe('AnnotationService', () => {
  it('adds a group on annotation data add', () => {
    const {service} = setup();
    const state = service.getSnapshot();
    expect(state.groups).toHaveLength(1);
    expect(state.groups[0]).toMatchObject({
      dataId: '1',
      editable: true,
      labelsVisible: true
    });
    expect(state.groups[0].annotations[0]).toMatchObject({
      id: 'a0',
      label: 'label-a0',
      factoryName: 'circle',
      visible: true
    });
  });

  it('ignores non annotation data', () => {
    const {dwvAppService, service} = setup();
    const before = service.getSnapshot();
    dwvAppService.data['2'] = {image: {}};
    dwvAppService.fire('dataadd', {dataid: '2'});
    expect(service.getSnapshot()).toBe(before);
  });

  it('notifies subscribers and keeps unchanged parts', () => {
    const {dwvAppService, service} = setup();
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    const before = service.getSnapshot();
    dwvAppService.fire('annotationadd',
      {dataid: '1', data: fakeAnnotation('a1')});
    expect(listener).toHaveBeenCalledTimes(1);
    const after = service.getSnapshot();
    expect(after).not.toBe(before);
    expect(after.groups[0].annotations.map((item) => item.id))
      .toEqual(['a0', 'a1']);
    expect(after.groups[0].annotations[0])
      .toBe(before.groups[0].annotations[0]);
    unsubscribe();
    dwvAppService.fire('annotationremove',
      {dataid: '1', data: fakeAnnotation('a1')});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('updates and removes annotations', () => {
    const {dwvAppService, service} = setup();
    dwvAppService.fire('annotationupdate',
      {dataid: '1', data: fakeAnnotation('a0', {colour: '#000000'})});
    expect(service.getSnapshot().groups[0].annotations[0].colour)
      .toBe('#000000');
    dwvAppService.fire('annotationremove',
      {dataid: '1', data: fakeAnnotation('a0')});
    expect(service.getSnapshot().groups[0].annotations).toHaveLength(0);
  });

  it('handles the selection', () => {
    const {dwvAppService, service} = setup();
    dwvAppService.fire('annotationselect',
      {dataid: '1', annotationid: 'a0'});
    expect(service.getSnapshot().selected)
      .toEqual({dataId: '1', annotationId: 'a0'});
    expect(service.selectAnnotation('1', 'unknown')).toBe(false);
    service.clearSelection();
    expect(service.getSnapshot().selected).toBeUndefined();
    // removing the selected annotation clears the selection
    service.selectAnnotation('1', 'a0');
    dwvAppService.fire('annotationremove',
      {dataid: '1', data: fakeAnnotation('a0')});
    expect(service.getSnapshot().selected).toBeUndefined();
  });

  it('removes the group on data remove', () => {
    const {dwvAppService, service, group} = setup();
    service.selectAnnotation('1', 'a0');
    dwvAppService.fire('dataremove', {dataid: '1'});
    expect(service.getSnapshot().groups).toHaveLength(0);
    expect(service.getSnapshot().selected).toBeUndefined();
    expect(group.listeners.size).toBe(0);
  });

  it('follows the group editability', () => {
    const {service} = setup();
    service.setAnnotationGroupEditable('1', false);
    expect(service.getSnapshot().groups[0].editable).toBe(false);
  });

  it('sets the annotation and labels visibility', () => {
    const {dwvAppService, service} = setup();
    service.setAnnotationVisibility('1', 'a0', false);
    expect(dwvAppService.drawLayer.setAnnotationVisibility)
      .toHaveBeenCalledWith('a0', false);
    expect(service.getSnapshot().groups[0].annotations[0].visible)
      .toBe(false);
    service.setLabelsVisibility('1', false);
    expect(dwvAppService.drawLayer.setLabelsVisibility)
      .toHaveBeenCalledWith(false);
    expect(service.getSnapshot().groups[0].labelsVisible).toBe(false);
  });

  it('goes to an annotation', () => {
    const {dwvAppService, service} = setup();
    service.gotoAnnotation('1', 'a0');
    expect(dwvAppService.drawLayer.setCurrentPosition)
      .toHaveBeenCalledWith({x: 1});
  });

  it('changes colour and deletes with undoable commands', () => {
    const {dwvAppService, service} = setup();
    service.changeAnnotationColour('1', 'a0', '#ff0000');
    const colourCtrl = DrawController.instances.at(-1);
    expect(colourCtrl.updateAnnotationWithCommand).toHaveBeenCalledWith(
      'a0', {colour: '#ffff80'}, {colour: '#ff0000'},
      dwvAppService.addToUndoStack);
    service.deleteAnnotation('1', 'a0');
    const deleteCtrl = DrawController.instances.at(-1);
    expect(deleteCtrl.removeAnnotationWithCommand).toHaveBeenCalledWith(
      'a0', dwvAppService.addToUndoStack);
  });

  it('adds a group on the active view layer', () => {
    const {dwvAppService, service} = setup();
    expect(service.addAnnotationGroup()).toBe(false);
    dwvAppService.getLayerGroupByDivId.mockReturnValue({
      getActiveViewLayer: () => ({getDataId: () => '0'})
    });
    expect(service.addAnnotationGroup()).toBe(true);
    expect(dwvAppService.createAnnotationData).toHaveBeenCalledWith('0');
    expect(dwvAppService.addAndRenderAnnotationData)
      .toHaveBeenCalledWith({}, 'layerGroup0', '0');
  });

  it('stops listening on dispose and can reconnect', () => {
    const {dwvAppService, service, group} = setup();
    service.dispose();
    expect(group.listeners.size).toBe(0);
    const before = service.getSnapshot();
    dwvAppService.fire('annotationadd',
      {dataid: '1', data: fakeAnnotation('a1')});
    expect(service.getSnapshot()).toBe(before);
    service.connect();
    expect(group.listeners.size).toBe(1);
  });
});
