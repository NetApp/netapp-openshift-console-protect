import * as React from 'react';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  ResourceLink,
  TableData,
  getGroupVersionKindForResource,
  RowProps,
  TableColumn,
  VirtualizedTable,
  ListPageHeader,
  ListPageBody,
  useK8sModel,
  k8sDelete,
} from '@openshift-console/dynamic-plugin-sdk';
import { 
  CustomizationResource 
} from 'src/k8s/types';
import { 
  Button, 
  // Dropdown, 
  // DropdownItem, 
  // DropdownList, 
  // MenuToggle, 
  // MenuToggleElement, 
  Modal 
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import SusanooTridentProtectHelmForm from './SusanooTridentProtectCreateHelm';

type SusanooTridentProtectHelmProps = {
  application: string;
};

const SusanooTridentProtectHelm: React.FC<SusanooTridentProtectHelmProps> = ({ application }) => {
  
    const columns: TableColumn<CustomizationResource>[] = [
      { title: 'Name', id: 'name' },
      { title: 'URL', id: 'url' },
      { title: 'Created at', id: 'creationTimestamp'},
      { title: '', id: 'actions' },
    ];
  
    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {

        const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
        const [resourceToDelete, setResourceToDelete] = React.useState<CustomizationResource | null>(null);
        const [k8sModel] = useK8sModel(getGroupVersionKindForResource(obj));
        
        const handleDelete = async () => {
          if (resourceToDelete) {
            try {
              await k8sDelete({ model: k8sModel, resource: resourceToDelete });
              console.log('Trident Protect Helm deleted successfully');
            } catch (err) {
              console.error('Failed to delete Trident Protect Helm:', err);
            } finally {
              setIsDeleteModalOpen(false);
              setResourceToDelete(null);
            }
          }
        };

        const confirmDelete = (resource: CustomizationResource) => {
          setResourceToDelete(resource);
          setIsDeleteModalOpen(true);
        };

        return (
          <>
            <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
              <ResourceLink 
                groupVersionKind={getGroupVersionKindForResource(obj)}
                name={obj.metadata?.name}
                namespace={obj.metadata?.namespace}
              />
            </TableData>
            <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
                {obj.spec?.connectionConfig?.url}
            </TableData>
            <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
              {obj.metadata?.creationTimestamp}
            </TableData>
            <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs} className="pf-u-text-align-center">
              <Button
                variant="plain"
                aria-label="Delete"
                onClick={() => confirmDelete(obj)}
                icon={<TrashIcon />}
              />
            </TableData>

            <Modal
              aria-label="Confirm Helm Delete"
              variant="small"
              title="Confirm Delete"
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              actions={[
                <Button 
                  aria-label='confirm delete button'
                  key="confirm" variant="danger" onClick={handleDelete}>
                  Delete
                </Button>,
                <Button 
                  aria-label='cancel delete button'
                  key="cancel" variant="link" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
              ]}
            >
              Are you sure you want to delete this Trident Protect Helm?
            </Modal>
          </>
        );
      };
    
    type SusanooTableProps = {
        data: CustomizationResource[];
        unfilteredData: CustomizationResource[];
        loaded: boolean;
        error?: Error;
    };

    const CustomizationTable = ({
        data,
        unfilteredData,
        loaded,
        error,
    }: SusanooTableProps) => {
        return (
            <VirtualizedTable<K8sResourceCommon>
              aria-label='Trident Protect Helm'
              data={data}
              unfilteredData={unfilteredData}
              loaded={loaded}
              loadError={error}
              columns={columns}
              Row={SusanooTableRow}
            />
        );
    };

    const resources = {
      group: 'helm.openshift.io',
      version: 'v1beta1',
      kind: 'ProjectHelmChartRepository',
    };
  
    const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
      groupVersionKind: resources,
      isList: true,
      namespaced: true,
    });
    
    const isHelmPresent = data.some((item) => item.spec?.name === 'trident-protect');
    const [isOpen, setIsOpen] = React.useState(false);
  
    return (
      <>
        <ListPageHeader 
          aria-label="Trident Protect Helm"
          title="Trident Protect Helm">
          <Button
            aria-label="create helm" 
            variant="primary"
            onClick={() => {setIsOpen(true);}}
            isDisabled={isHelmPresent}
          >
            Create
          </Button>
        </ListPageHeader>
        <ListPageBody>
          <CustomizationTable 
            data={data.filter((item) => item.spec?.name === 'trident-protect')}
            unfilteredData={data}
            loaded={loaded}
            error={error}
          />
        </ListPageBody>
        <SusanooTridentProtectHelmForm 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
};

const SusanooTridentProtectHelmDetails: React.FC<SusanooTridentProtectHelmProps> = ({ application }) => {
    return (
        <SusanooTridentProtectHelm application={application} />
    );
}

export default SusanooTridentProtectHelmDetails;