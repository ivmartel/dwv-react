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

  it('lists non DICOM meta data', () => {
    render(<TagsTable data={{fileType: {value: 'png'}}} />);
    expect(screen.getByText('fileType')).toBeInTheDocument();
    expect(screen.getByText('png')).toBeInTheDocument();
  });
});
