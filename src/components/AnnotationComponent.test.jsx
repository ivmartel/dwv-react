import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('dwv', () => ({
  i18n: {t: () => undefined}
}));

import AnnotationComponent from './AnnotationComponent.jsx';
import {
  AnnotationServiceContext
} from '../services/AnnotationServiceProvider.jsx';

/**
 * Create a fake annotation service with a given state.
 *
 * @param {object} state The state.
 * @returns {object} The service.
 */
const fakeService = (state) => ({
  getSnapshot: () => state,
  subscribe: () => () => {},
  selectAnnotation: vi.fn(),
  gotoAnnotation: vi.fn(),
  setAnnotationVisibility: vi.fn(),
  deleteAnnotation: vi.fn(),
  changeAnnotationColour: vi.fn(),
  setAnnotationGroupEditable: vi.fn(),
  setLabelsVisibility: vi.fn(),
  getAnnotationGroupAsDicom: vi.fn(() => {
    throw new Error('save error');
  })
});

const state = {
  groups: [{
    dataId: '1',
    editable: true,
    labelsVisible: true,
    annotations: [{
      id: 'a0',
      label: 'circle-0',
      colour: '#ffff80',
      factoryName: 'circle',
      canView: true,
      visible: true,
      quantification: {surface: {value: 12.345, unit: 'mm2'}}
    }]
  }],
  selected: undefined
};

const renderWith = (service) => render(
  <AnnotationServiceContext.Provider value={service}>
    <AnnotationComponent />
  </AnnotationServiceContext.Provider>
);

describe('AnnotationComponent', () => {
  it('lists the groups and annotations', () => {
    renderWith(fakeService(state));
    expect(screen.getByText('group #1')).toBeInTheDocument();
    expect(screen.getByText('circle-0')).toBeInTheDocument();
  });

  it('goes to an annotation on click', () => {
    const service = fakeService(state);
    renderWith(service);
    fireEvent.click(screen.getByText('circle-0'));
    expect(service.selectAnnotation).toHaveBeenCalledWith('1', 'a0');
    expect(service.gotoAnnotation).toHaveBeenCalledWith('1', 'a0');
  });

  it('forwards the annotation actions', () => {
    const service = fakeService(state);
    renderWith(service);
    fireEvent.click(screen.getByTitle('Show/hide annotation'));
    expect(service.setAnnotationVisibility)
      .toHaveBeenCalledWith('1', 'a0', false);
    fireEvent.click(screen.getByTitle('Delete annotation'));
    expect(service.deleteAnnotation).toHaveBeenCalledWith('1', 'a0');
    fireEvent.click(screen.getByTitle('Lock group'));
    expect(service.setAnnotationGroupEditable)
      .toHaveBeenCalledWith('1', false);
    fireEvent.click(screen.getByTitle('Show/hide annotation labels'));
    expect(service.setLabelsVisibility).toHaveBeenCalledWith('1', false);
    // actions do not trigger a go to
    expect(service.gotoAnnotation).not.toHaveBeenCalled();
  });

  it('shows the quantification', () => {
    renderWith(fakeService(state));
    expect(screen.queryByText('area:')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Show/hide quantification'));
    expect(screen.getByText('area:')).toBeInTheDocument();
    expect(screen.getByText('12.35 mm2')).toBeInTheDocument();
  });

  it('disables edits on locked groups', () => {
    const locked = {
      ...state,
      groups: [{...state.groups[0], editable: false}]
    };
    renderWith(fakeService(locked));
    expect(screen.getByTitle('Delete annotation')).toBeDisabled();
    expect(screen.getByTitle('Change annotation colour')).toBeDisabled();
  });

  it('shows save errors', () => {
    const service = fakeService(state);
    renderWith(service);
    fireEvent.click(screen.getByTitle('Save annotation group'));
    expect(screen.getByText('save error')).toBeInTheDocument();
  });
});
