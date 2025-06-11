import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  Modal,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { k8sCreate, useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

type ScheduleFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SusanooProtectCreateAppSchedule: React.FC<ScheduleFormProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [dataMover, setDataMover] = React.useState('none');
  const [applicationRef, setApplicationRef] = React.useState('');
  const [appVaultRef, setAppVaultRef] = React.useState('');
  const [backupRetention, setBackupRetention] = React.useState('15');
  const [snapshotRetention, setSnapshotRetention] = React.useState('15');
  const [granularity, setGranularity] = React.useState('Hourly');
  const [dayOfMonth, setDayOfMonth] = React.useState('1');
  const [dayOfWeek, setDayOfWeek] = React.useState('1');
  const [hour, setHour] = React.useState('0');
  const [minute, setMinute] = React.useState('0');

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

    const schedule: any = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Schedule',
      metadata: {
        name,
        namespace,
      },
      spec: {
        applicationRef,
        appVaultRef,
        backupRetention,
        snapshotRetention,
        granularity,
        dayOfMonth,
        dayOfWeek,
        hour,
        minute,
      }
    };

    if (dataMover !== 'none') {
      schedule.spec.dataMover = dataMover;
    }

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Schedule',
          abbr: 'SCH',
          label: 'Schedule',
          labelPlural: 'Schedules',
          plural: 'schedules',
          namespaced: true,
          crd: true
        },
        data: schedule,
        ns: namespace
      });
      console.log('Schedule created successfully');
      onClose();
    } catch (err) {
      console.error('Failed to create Schedule:', err);
    }
  };

  const handleCancel = () => {
    setName('');
    setNamespace('');
    setDataMover('none');
    setApplicationRef('');
    setAppVaultRef('');
    setBackupRetention('15');
    setSnapshotRetention('15');
    setGranularity('Hourly');
    setDayOfMonth('1');
    setDayOfWeek('1');
    setHour('0');
    setMinute('0');
    onClose();
  };

  return (
    <Modal
      variant="medium"
      title="Create Trident Protect Application Schedule"
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
        <FormGroup label="Schedule Name" isRequired fieldId="schedule-name">
          <TextInput
            id="schedule-name"
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
            <FormSelectOption value="none" label="None" />
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

        <FormGroup label="Backup Retention" isRequired fieldId="backup-retention">
          <TextInput
            id="backup-retention"
            value={backupRetention}
            onChange={(_event, val) => setBackupRetention(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Snapshot Retention" isRequired fieldId="snapshot-retention">
          <TextInput
            id="snapshot-retention"
            value={snapshotRetention}
            onChange={(_event, val) => setSnapshotRetention(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Granularity and Schedule" isRequired fieldId="granularity-schedule">
          <Split hasGutter>
            <SplitItem>
              <FormSelect
                id="granularity-select"
                value={granularity}
                onChange={(event) => setGranularity(event.currentTarget.value)}
              >
                <FormSelectOption value="Hourly" label="Hourly" />
                <FormSelectOption value="Daily" label="Daily" />
                <FormSelectOption value="Weekly" label="Weekly" />
                <FormSelectOption value="Monthly" label="Monthly" />
              </FormSelect>
            </SplitItem>
            <SplitItem>
              <FormSelect
                id="minute-select"
                value={minute}
                onChange={(event) => setMinute(event.currentTarget.value)}
              >
                <FormSelectOption value="" label="Select minute" />
                {Array.from({ length: 60 }, (_, i) => (
                  <FormSelectOption key={i} value={i.toString()} label={i.toString()} />
                ))}
              </FormSelect>
            </SplitItem>
            <SplitItem>
              <FormSelect
                id="hour-select"
                value={hour}
                onChange={(event) => setHour(event.currentTarget.value)}
                isDisabled={granularity === 'Hourly'}
              >
                <FormSelectOption value="" label="Select hour" />
                {Array.from({ length: 24 }, (_, i) => (
                  <FormSelectOption key={i} value={i.toString()} label={i.toString()} />
                ))}
              </FormSelect>
            </SplitItem>
            <SplitItem>
              <FormSelect
                id="day-of-week-select"
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.currentTarget.value)}
                isDisabled={granularity !== 'Weekly' && granularity !== 'Monthly'}
              >
                <FormSelectOption value="" label="Select day of week" />
                {Array.from({ length: 7 }, (_, i) => (
                  <FormSelectOption key={i + 1} value={(i + 1).toString()} label={(i + 1).toString()} />
                ))}
              </FormSelect>
            </SplitItem>
            <SplitItem>
              <FormSelect
                id="day-of-month-select"
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(event.currentTarget.value)}
                isDisabled={granularity !== 'Monthly'}
              >
                <FormSelectOption value="" label="Select day of month" />
                {Array.from({ length: 31 }, (_, i) => (
                  <FormSelectOption key={i + 1} value={(i + 1).toString()} label={(i + 1).toString()} />
                ))}
              </FormSelect>
            </SplitItem>
          </Split>
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default SusanooProtectCreateAppSchedule;