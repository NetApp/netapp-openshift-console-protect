import * as React from 'react';
import {
  getGroupVersionKindForResource,
  K8sResourceCommon,
  ListPageBody,
  ListPageHeader,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { 
  CustomizationResource 
} from '../../k8s/types';
import { 
  AboutModal,
  Button, 
  Card, 
  CardBody, 
  CardTitle, 
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Modal,
  Popover,
  ProgressStep,
  ProgressStepper,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextListVariants,
  TextVariants,
  Wizard,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core';
import { 
  EllipsisVIcon,
  CloudSecurityIcon, 
} from '@patternfly/react-icons';
import { 
  useHistory 
} from 'react-router';
import SusanooPluginAbout from '../SusanooPluginAbout';
import NetAppLogo from '../../assets/images/NA_logo_white_rgb.png';
import useActivationKeyCheck from '../../utils/SusanooActivationKeyCheck';
import SusanooTridentProtectActivationDetails from './protect/SusanooTridentProtectActivationDetails';
import SusanooTridentProtectHelmDetails from './protect/SusanooTridentProtectHelmDetails';
import SusanooTridentProtectAppVaultDetails from './protect/SusanooTridentProtectAppVaultDetails';

// Defining generic table props
type SusanooTableProps = {
  data: CustomizationResource[];
  unfilteredData: CustomizationResource[];
  loaded: boolean;
  error?: Error;
};

// Logic to display the Susanoo Console Plugin status
const SusanooConsolePlugin = () => {

  const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
    const columns: TableColumn<K8sResourceCommon>[] = [
      { title: 'Name', id: 'name' },
      { title: 'Version', id: 'version'},
      { title: 'Display Name', id: 'displayName' }, 
      { title: 'Created at', id: 'creationTimestamp' },
      { title: '', id: 'actions' }
    ];

    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {

      const history = useHistory();
      const [isOpen, setIsOpen] = React.useState(false);

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
            {obj.metadata?.labels?.['app.kubernetes.io/version']}
          </TableData>
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
            {obj.spec?.displayName}
          </TableData>
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata?.creationTimestamp}
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs} className="pf-u-text-align-center">
            <Dropdown
              isOpen={isOpen}
              onSelect={(_event, value) => {
                if (value === 'disable') {
                  history.push(`/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins`);
                }
                setIsOpen(false);
              }}
              onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label="plugin-actions"
                  variant="plain"
                  onClick={() => setIsOpen(!isOpen)}
                  isExpanded={isOpen}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem value="disable" key="disable">Disable</DropdownItem>
              </DropdownList>
            </Dropdown>
          </TableData>
        </>
      );
    };

    return (
      <VirtualizedTable<K8sResourceCommon>
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
    group: 'console.openshift.io',
    version: 'v1',
    kind: 'ConsolePlugin',
  };

  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };   

  return (
    <>
      <ListPageHeader title="NetApp OpenShift Console for Protect">
        <Button 
          variant='primary'
          onClick={handleModalToggle}
        >
          About
        </Button>
        <AboutModal 
          isOpen={isModalOpen}
          onClose={handleModalToggle}
          brandImageAlt='NetApp, Inc Logo'
          brandImageSrc={NetAppLogo}
          backgroundImageSrc='/assets/netapp-logo.svg'
          trademark='NETAPP, the NETAPP logo, and the marks listed on the NetApp Trademarks page are trademarks of NetApp, Inc. Other company and product names may be trademarks of their respective owners.'
          aria-label='About NetApp Protect OpenShift Console Plug-in'
        >
          <SusanooPluginAbout />
        </AboutModal>
      </ListPageHeader>
      <ListPageBody>
        <Card>
          <CardTitle>Plugins</CardTitle>
          <CardBody>
            <SusanooTable 
              data={data.filter(item => item.metadata.name === 'netapp-openshift-console-protect')}
              unfilteredData={data}
              loaded={loaded}
              error={error}
            />
          </CardBody>
        </Card>
      </ListPageBody>
    </>
  );  
};

export const SusanooProtectDeployProgress = () => {

  // const [isOpen, setIsOpen] = React.useState(false);

  const activationResources = {
    version: 'v1',
    kind: 'Secret',
    namespaced: true,
  };
  const [activationData] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: activationResources,
    isList: true,
    namespaced: true,
  });
  const activationObj = activationData[0];

  const [ isWizardOpen, setIsWizardOpen ] = React.useState(false);
  // const [ isActivationOpen, setIsActivationOpen ] = React.useState(false);
  const {isValidKey, isLoading } = useActivationKeyCheck();

  const helmResources = {
    group: 'helm.openshift.io',
    version: 'v1beta1',
    kind: 'ProjectHelmChartRepository',
  };
  const [helmData] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: helmResources,
    isList: true
  });
  // const helmObj = helmData[0];
  // const [isHelmOpen, setIsHelmOpen ] = React.useState(false);
  const isHelmRepoPresent = helmData.some((item) => item.spec?.name === 'trident-protect');
  // const [isAppVaultOpen, setIsAppVaultOpen ] = React.useState(false);


  const helmReleaseResources = {
    group: 'apps',
    version: 'v1',
    kind: 'Deployment',
  };
  const [helmReleaseData] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: helmReleaseResources,
    isList: true,
    namespaced: true,
  });
  const isHelmReleasePresent = helmReleaseData.some((item) => item.metadata?.name === 'trident-protect-controller-manager');
  
  const [ selectedResource, setSelectedResource ] = React.useState<{ namespace: string, name: string } | null>(null);

  if (isLoading) {
    return <div></div>;
  }

  // const history = useHistory();
  return (
    <>
      <ListPageHeader title="Trident Protect">
        <Button
          variant='primary'
          onClick={() => {
            setIsWizardOpen(true);
            setSelectedResource({ namespace: activationObj.metadata?.namespace, name: activationObj.metadata?.name });
          }}
        >
          Configure
        </Button>
      </ListPageHeader>
      <ListPageBody>
        <Card>
          <CardTitle>Deployment Status</CardTitle>
          <CardBody>
            <ProgressStepper 
              aria-label="Trident Protect Installation Progress" 
              isCenterAligned
              >
                <ProgressStep
                  variant={isValidKey ? 'success' : 'warning'}   
                  id="protect-3"
                  titleId='protect-3' 
                  popoverRender={(stepRef) =>
                    <Popover 
                      ariad-label="Activate EAP"
                      headerContent="Trident Protect EAP Activation"
                      bodyContent={isValidKey ? "Trident Protect EAP successfully activated." : "Click Actions to enter the activation key."}
                      triggerRef={stepRef}
                    />
                  }
                >
                  EAP Activation
                </ProgressStep>                
                <ProgressStep
                  variant={isHelmRepoPresent ? 'success' : 'pending'}   
                  id="protect-1"
                  titleId='protect-1' 
                  popoverRender={(stepRef) =>
                    <Popover 
                      ariad-label="Protect Helm Installation"
                      headerContent="Trident Protect Helm Charts"
                      bodyContent={isHelmRepoPresent ? "Trident Protect Helm Charts installed successfully." : "Click Actions to deploy the NetApp supported Helm Charts that manages Trident Protect deployment and maintenance on Red Hat OpenShift."}
                      triggerRef={stepRef}
                    />
                  }
                >
                  Helm Repository
                </ProgressStep>
                <ProgressStep
                  variant={isHelmReleasePresent ? 'success' : 'pending'}  
                  id="protect-2"
                  titleId='protect-2' 
                  popoverRender={(stepRef) =>
                    <Popover 
                      ariad-label="Protect Helm Installation"
                      headerContent="Trident Protect Helm Charts"
                      bodyContent={isHelmReleasePresent ? "Trident Protect Helm Charts installed successfully." : "Click Actions to deploy the NetApp supported Helm Charts that manages Trident Protect deployment and maintenance on Red Hat OpenShift."}
                      triggerRef={stepRef}
                    />
                  }
                >
                  Helm Release
                </ProgressStep>                                
                <ProgressStep
                  icon={<CloudSecurityIcon />} 
                  id="protect-7"
                  titleId='protect-7' 
                  popoverRender={(stepRef) =>
                    <Popover 
                      ariad-label="Protect Application Vault"
                      headerContent="Trident Protect Application Vault"
                      bodyContent={"Configure a S3 endpoint to offload backups."}
                      triggerRef={stepRef}
                    />
                  }
                >
                  Application Vault
                </ProgressStep>
            </ProgressStepper>
          </CardBody>
        </Card>
      </ListPageBody>
      {selectedResource && (
        <Modal 
          aria-label='Trident Protect Wizard'
          variant="large"
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          hasNoBodyWrapper
          showClose={false}
        >
          <Wizard
            onClose={() => setIsWizardOpen(false)}
            header={
              <WizardHeader
                title="Trident Protect Deployment"
                titleId="trident-protect-wizard"
                onClose={() => setIsWizardOpen(false)}
                description="This wizard will guide you through the required steps to deploy and configure Trident Protect to backup your containerized and virtualized workloads."
                aria-describedby='trident-protect-wizard'
                aria-label='Trident Protect Deployment Wizard'
              />
            }
          >
            <WizardStep name="Information" id="trident-protect-info">
              <TextContent>
                <Text component={TextVariants.h1}>Trident Protect</Text>
                <Text component={TextVariants.p}>NetApp Trident Protect provides advanced application data management capabilities that enhance the functionality and availability of stateful Kubernetes applications backed by NetApp ONTAP storage systems and the NetApp Trident CSI storage provisioner. Trident Protect simplifies the management, protection, and movement of containerized and virtualized workloads across public clouds and on-premises environments. It also offers automation capabilities through its API and CLI.</Text>
                <Text component={TextVariants.p}>The following steps are required to deploy and configure Trident Protect on Red Hat OpenShift:</Text>
                <TextList component={TextListVariants.ol}>
                  <TextListItem>Activate Trident Protect EAP</TextListItem>
                  <TextListItem>Add the Helm Chart repository</TextListItem>
                  <TextListItem>Install the Trident Protect CRDs</TextListItem>
                  <TextListItem>Install Trident Protect</TextListItem>
                  <TextListItem>Configure Application Vaults</TextListItem>
                </TextList>
              </TextContent>
            </WizardStep>
            <WizardStep name="Activation" id="trident-protect-activation">
              <TextContent>
              <SusanooTridentProtectActivationDetails application={selectedResource.name} />
                <Text component={TextVariants.h1}>Help</Text>
                <Text component={TextVariants.p}>This steps enables the Early Access Program for Trident Protect with the provided key by NetApp.</Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="Helm Charts" id="trident-protect-helm">
              <TextContent>
                <SusanooTridentProtectHelmDetails application={selectedResource.name} />
                <Text component={TextVariants.h1}>Help</Text>
                <Text component={TextVariants.p}>Future feature to configure multi-tenancy for Trident Protect.</Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="CRDs" id="trident-protect-crds" >
                <TextContent>
                <Text component={TextVariants.h1}>Help</Text>
                <Text component={TextVariants.p}>This step requires a manual intervention to install the controller & CRDs for Trident Protect.</Text>
                <Text component={TextVariants.p}>To install the CRDs, follow either the GUI:</Text>
                <Text component={TextVariants.p}>
                  <ul>
                    <li>
                      Go in the Developer view, select the project <b>trident-protect</b>
                    </li>
                    <li>
                      Click on <b>Helm</b> then click the button <b>Create</b> and select <b>Helm Release</b>
                    </li>
                    <li>
                      Search <b>Trident Protect</b> and click the tile with the same name
                    </li>
                    <li>
                      Click the button <b>Create</b>
                    </li>
                    <li>
                      Edit any value you see fit before clicking <b>Create</b>
                    </li>
                  </ul>
                </Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="Access Control" id="trident-protect-rbac">
              <TextContent>
                <Text component={TextVariants.h1}>RBAC</Text>
                <Text component={TextVariants.p}>Future feature to configure multi-tenancy for Trident Protect.</Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="Monitoring" id="trident-protect-monitoring" >
              <TextContent>
                <Text component={TextVariants.h1}>Monitoring</Text>
                <Text component={TextVariants.p}>Future feature to configure a Prometheus endpoint.</Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="Resource Limitations" id="trident-protect-resources" >
              <TextContent>
                <Text component={TextVariants.h1}>Resources Limitations</Text>
                <Text component={TextVariants.p}>Future feature to configure a resources limitations for Protect jobs.</Text>
              </TextContent>
            </WizardStep>
            <WizardStep name="Application Vault" id="trident-protect-appvault">
              <SusanooTridentProtectAppVaultDetails application={selectedResource.name} />
              <TextContent>
                <Text component={TextVariants.h1}>Help</Text>
                <Text component={TextVariants.p}>The Application Vault object defines a remote location, often a S3 endpoint, to offload the application backups taken on this cluster. This allows to restore the entire application as it was when the backup was taken on this cluster or any other one that have Trident Protect deployed.</Text>
              </TextContent>
            </WizardStep>
          </Wizard>
        </Modal>
      )}
    </>
  )

};

const SusanooBackendSetup = () => {  

  return (
    <>
        <SusanooConsolePlugin />
        <SusanooProtectDeployProgress />
    </>
  );
};

export default SusanooBackendSetup;
