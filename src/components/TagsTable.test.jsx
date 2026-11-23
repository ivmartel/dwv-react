import { render, screen, fireEvent } from '@testing-library/react';

import TagsTable from './TagsTable.jsx';

const dicomMeta = {
  '00020010': {value: ['1.2.840.10008.1.2.1'], vr: 'UI'},
  '00100010': {value: ['Doe^John'], vr: 'PN'},
  '00080060': {value: ['MR'], vr: 'CS'},
  '00200013': {value: ['3'], vr: 'IS'}
};

describe('TagsTable', () => {
  it('lists the tags with their dictionary names', () => {
    render(<TagsTable data={dicomMeta} />);
    expect(screen.getByText('PatientName')).toBeInTheDocument();
    expect(screen.getByText('Doe^John')).toBeInTheDocument();
    expect(screen.getByText('Modality')).toBeInTheDocument();
  });

  it('filters the tags on search', () => {
    render(<TagsTable data={dicomMeta} />);
    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'doe'}});
    expect(screen.getByText('Doe^John')).toBeInTheDocument();
    expect(screen.queryByText('Modality')).not.toBeInTheDocument();
  });

  it('shows the values of the first merged slice', () => {
    // dwv merged meta data: values that differ between slices
    // are indexed by merge id
    const mergedMeta = {
      mergeId: ['2', '10', '1'],
      '00020010': {value: ['1.2.840.10008.1.2.1'], vr: 'UI'},
      '00100010': {value: ['Doe^John'], vr: 'PN'},
      '00200013': {value: {'1': ['1'], '2': ['2'], '10': ['10']}, vr: 'IS'},
      '00080018': {
        value: {'1': ['uid.1'], '2': ['uid.2'], '10': ['uid.10']},
        vr: 'UI'
      }
    };
    render(<TagsTable data={mergedMeta} />);
    expect(screen.getByText('Doe^John')).toBeInTheDocument();
    expect(screen.getByText('uid.1')).toBeInTheDocument();
    expect(screen.queryByText('uid.2')).not.toBeInTheDocument();
    expect(screen.queryByText('mergeId')).not.toBeInTheDocument();
  });

  it('lists non DICOM meta data', () => {
    render(<TagsTable data={{fileType: {value: 'png'}}} />);
    expect(screen.getByText('fileType')).toBeInTheDocument();
    expect(screen.getByText('png')).toBeInTheDocument();
  });
});
