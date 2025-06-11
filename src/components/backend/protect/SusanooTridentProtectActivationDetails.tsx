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
import { CustomizationResource } from 'src/k8s/types';
import { Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Modal } from '@patternfly/react-core';
import SusanooProtectCreateActivationKey from '../../protect/SusanooProtectCreateActivationKey';

type SusanooTridentProtectActivationProps = {
  application: string;
};

const SusanooTridentProtectActivation: React.FC<SusanooTridentProtectActivationProps> = ({ application }) => {
  
    const columns: TableColumn<CustomizationResource>[] = [
      { title: 'Name', id: 'name' },
      { title: 'Namespace', id: 'namespace' },
      { title: 'Created at', id: 'creationTimestamp'},
      { title: '', id: 'actions' },
    ];
  
    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {

        const [isActionOpen, setIsActionOpen] = React.useState(false);      
        const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
        const [resourceToDelete, setResourceToDelete] = React.useState<CustomizationResource | null>(null);

        const [k8sModel] = useK8sModel(getGroupVersionKindForResource(obj));
        
        const handleDelete = async () => {
          if (resourceToDelete) {
            try {
              await k8sDelete({ model: k8sModel, resource: resourceToDelete });
              console.log('Trident Protect Activation deleted successfully');
            } catch (err) {
              console.error('Failed to delete Trident Protect Activation:', err);
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
              {obj.metadata?.namespace}
            </TableData>
            <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
              {obj.metadata?.creationTimestamp}
            </TableData>
            <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs} className="pf-u-text-align-center">
              <Dropdown
                isOpen={isActionOpen}
                onSelect={(_event, value) => {
                  if (value === 'delete') {
                    confirmDelete(obj);
                  }
                  setIsActionOpen(false);
                }}
                onOpenChange={(isActionOpen: boolean) => setIsActionOpen(isActionOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    aria-label="backendconfig-actions"
                    onClick={() => setIsActionOpen(!isActionOpen)}
                    isExpanded={isActionOpen}
                  >
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem value="delete" key="delete">Delete</DropdownItem>
                </DropdownList>
              </Dropdown>
            </TableData>

            <Modal
              variant="small"
              title="Confirm Delete"
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              actions={[
                <Button key="confirm" variant="danger" onClick={handleDelete}>
                  Delete
                </Button>,
                <Button key="cancel" variant="link" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
              ]}
            >
              Are you sure you want to delete this Trident Protect Activation?
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
              aria-label='Trident backendconfig'
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
      version: 'v1',
      kind: 'Secret',
    };
  
    const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
      groupVersionKind: resources,
      isList: true,
      namespaced: true,
    });
    
    const [isOpen, setIsOpen] = React.useState(false);
  
    return (
      <>
        <ListPageHeader title="Trident Protect Activation">
          <Button 
            variant="primary"
            onClick={() => {setIsOpen(true);}}
          >
            Create
          </Button>
        </ListPageHeader>
        <ListPageBody>
          <CustomizationTable 
            data={data.filter((item) => item.metadata?.name?.includes('susanoo-activation-key'))}
            unfilteredData={data}
            loaded={loaded}
            error={error}
          />
        </ListPageBody>
        <SusanooProtectCreateActivationKey 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
};

const SusanooTridentProtectActivationDetails: React.FC<SusanooTridentProtectActivationProps> = ({ application }) => {
    return (
        <SusanooTridentProtectActivation application={application} />
    );
}

export default SusanooTridentProtectActivationDetails;