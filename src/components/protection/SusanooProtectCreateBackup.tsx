import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  Modal,
} from '@patternfly/react-core';
import { k8sCreate, useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

type ScheduleFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SusanooProtectCreateAppSchedule: React.FC<ScheduleFormProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [dataMover, setDataMover] = React.useState('Kopia');
  const [applicationRef, setApplicationRef] = React.useState('');
  const [appVaultRef, setAppVaultRef] = React.useState('');

  const applicationResource = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Application',
  };

  const appVaultResource = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'AppVault',
  };

  const [applications, applicationsLoaded] = useK8sWatchResource<K8sResourceCommon[]>({ 
    groupVersionKind: applicationResource,
    isList: true,
    namespaced: true,
  });

  const [appVaults, appVaultsLoaded] = useK8sWatchResource<K8sResourceCommon[]>({ 
    groupVersionKind: appVaultResource,
    isList: true,
    namespaced: true,
  });

  React.useEffect(() => {
    console.log('Applications loaded:', applications);
    console.log('AppVaults loaded:', appVaults);
  }, [applications, appVaults]);

  const applicationOptions = React.useMemo(() => 
    Array.isArray(applications) ? applications.map(app => ({
      name: app.metadata?.name || '',
      namespace: app.metadata?.namespace || ''
    })) : [], 
    [applications]
  );

  const appVaultOptions = React.useMemo(() => 
    Array.isArray(appVaults) ? appVaults.map(av => ({
      name: av.metadata?.name || '',
      namespace: av.metadata?.namespace || ''
    })) : [], 
    [appVaults]
  );

  console.log('Applications:', applications);
  console.log('Application options:', applicationOptions);
  console.log('AppVaults:', appVaults);
  console.log('AppVault options:', appVaultOptions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !namespace || !applicationRef || !appVaultRef) {
      console.error('Required fields are missing');
      return;
    }

    const backup: any = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Backup',
      metadata: {
        name,
        namespace,
      },
      spec: {
        applicationRef,
        appVaultRef,
        dataMover,
      }
    };

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Backup',
          abbr: 'BKP',
          label: 'Backup',
          labelPlural: 'Backups',
          plural: 'backups',
          namespaced: true,
          crd: true
        },
        data: backup,
        ns: namespace
      });
      console.log('On-Demand Backup created successfully');
      onClose();
    } catch (err) {
      console.error('Failed to create on-demand Backup:', err);
    }
  };

  const handleCancel = () => {
    setName('');
    setNamespace('');
    setDataMover('Kopia');
    setApplicationRef('');
    setAppVaultRef('');
    onClose();
  };

  return (
    <Modal
      variant="medium"
      title="Create Trident Protect on-demand Backup"
      isOpen={isOpen}
      onClose={handleCancel}
      actions={[
        <Button 
          key="create" 
          variant="primary" 
          onClick={handleSubmit}
          isDisabled={!name || !namespace || !applicationRef || !appVaultRef}
        >
          Create
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      ]}
    >
      <Form>
        <FormGroup label="Backup Name" isRequired fieldId="backup-name">
          <TextInput
            id="backup-name"
            value={name}
            onChange={(_event, val) => setName(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Data Mover" fieldId="data-mover">
          <FormSelect
            id="data-mover-select"
            value={dataMover}
            onChange={(event) => setDataMover(event.currentTarget.value)}
          >
            <FormSelectOption value="Kopia" label="Kopia" />
            <FormSelectOption value="Restic" label="Restic" />
          </FormSelect>
        </FormGroup>

        <FormGroup label="Application Reference" isRequired fieldId="application-ref">
          <FormSelect
            id="application-ref-select"
            value={applicationRef}
            onChange={(event) => {
              const selectedApp = applicationOptions.find(app => app.name === event.currentTarget.value);
              if (selectedApp) {
                setApplicationRef(selectedApp.name);
                setNamespace(selectedApp.namespace);
              }
            }}
            isDisabled={!applicationsLoaded}
          >
            <FormSelectOption key="placeholder" value="" label="Select application reference" isPlaceholder />
            {applicationOptions.map((app) => (
              <FormSelectOption key={app.name} value={app.name} label={`${app.name} (${app.namespace})`} />
            ))}
          </FormSelect>
        </FormGroup>

        <FormGroup label="AppVault Reference" isRequired fieldId="appvault-ref">
          <FormSelect
            id="appvault-ref-select"
            value={appVaultRef}
            onChange={(event) => setAppVaultRef(event.currentTarget.value)}
            isDisabled={!appVaultsLoaded}
          >
            <FormSelectOption key="placeholder" value="" label="Select AppVault" isPlaceholder />
            {appVaultOptions.map((appVault) => (
              <FormSelectOption key={appVault.name} value={appVault.name} label={`${appVault.name} (${appVault.namespace})`} />
            ))}
          </FormSelect>
        </FormGroup>

      </Form>
    </Modal>
  );
};

export default SusanooProtectCreateAppSchedule;