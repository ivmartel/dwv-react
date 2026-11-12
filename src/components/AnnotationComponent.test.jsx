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
    const info = screen.getByTitle('Show/hide quantification');
    const detailsId = 'qd-annotationgroup1-annotationa0';
    expect(info).toHaveAttribute('aria-controls', detailsId);
    expect(info).toHaveAttribute('aria-pressed', 'false');
    expect(info).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(detailsId)).toBeInTheDocument();
    fireEvent.click(info);
    expect(info).toHaveAttribute('aria-pressed', 'true');
    expect(info).toHaveAttribute('aria-expanded', 'true');
    // short label, full label as title
    expect(screen.getByText('area')).toBeInTheDocument();
    expect(screen.getByTitle('area')).toHaveTextContent('area12.35 mm2');
    expect(screen.getByText('12.35 mm2')).toBeInTheDocument();
  });

  it('uses short labels and groups for the quantification', () => {
    const quantified = {
      ...state,
      groups: [{
        ...state.groups[0],
        annotations: [{
          ...state.groups[0].annotations[0],
          quantification: {
            stddev: {value: 1.5},
            p25: {value: 120},
            surface: {value: undefined}
          }
        }]
      }]
    };
    renderWith(fakeService(quantified));
    fireEvent.click(screen.getByTitle('Show/hide quantification'));
    expect(screen.getByText('Pixel values')).toBeInTheDocument();
    expect(screen.queryByText('Geometry')).not.toBeInTheDocument();
    expect(screen.getByTitle('standard deviation'))
      .toHaveTextContent('stddev1.50');
    expect(screen.getByTitle('25th percentile'))
      .toHaveTextContent('p25120.0');
  });

  it('shows empty states', () => {
    const empty = {
      groups: [
        {...state.groups[0], dataId: '0', annotations: []},
        {
          ...state.groups[0],
          annotations: [{...state.groups[0].annotations[0],
            quantification: undefined}]
        }
      ],
      selected: undefined
    };
    renderWith(fakeService(empty));
    expect(screen.getByText('No annotation')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Show/hide quantification'));
    expect(screen.getByText('No quantification')).toBeInTheDocument();
  });

  it('marks and scrolls to the selected annotation', () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderWith(fakeService({
      ...state,
      selected: {dataId: '1', annotationId: 'a0'}
    }));
    const row = document.getElementById('annotationgroup1-annotationa0');
    expect(row).toHaveClass('selected');
    expect(scrollIntoView).toHaveBeenCalledWith({block: 'nearest'});
    delete window.HTMLElement.prototype.scrollIntoView;
  });

  it('uses a button for the row content', () => {
    renderWith(fakeService(state));
    const content = screen.getByTitle('Go to annotation');
    expect(content.tagName).toBe('BUTTON');
    expect(content).toHaveTextContent('circle-0');
    // actions are not nested in the content button
    expect(content).not.toContainElement(
      screen.getByTitle('Delete annotation'));
  });

  it('strikes through non viewable annotations', () => {
    renderWith(fakeService({
      ...state,
      groups: [{
        ...state.groups[0],
        annotations: [{...state.groups[0].annotations[0], canView: false}]
      }]
    }));
    expect(screen.getByText('circle-0'))
      .toHaveStyle({textDecoration: 'line-through'});
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
