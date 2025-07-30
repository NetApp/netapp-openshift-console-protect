import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Modal,
} from '@patternfly/react-core';
import { 
  k8sCreate, 
  k8sGet 
} from '@openshift-console/dynamic-plugin-sdk';

type SusanooTridentProtectHelmProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SusanooTridentProtectHelmForm: React.FC<SusanooTridentProtectHelmProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState('trident');
  const [namespace, setNamespace] = React.useState('trident-protect');
  const [url, setUrl] = React.useState('https://netapp.github.io/trident-protect-helm-chart');
  const [chartName, setChartName] = React.useState('trident-protect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      console.error('Required fields are missing');
      return;
    }

    const namespaceObj = {
      apiVersion: 'project.openshift.io/v1',
      kind: 'Project',
      metadata: {
        name: 'trident-protect',
        labels: {
          'susanoo.trident.netapp.io': 'true',
        },
      },
    };

    const helmChart = {
      apiVersion: 'helm.openshift.io/v1beta1',
      kind: 'ProjectHelmChartRepository',
      metadata: {
        name: 'trident-protect',
        namespace: 'trident-protect',
        labels: {
          'susanoo.trident.netapp.io': 'true',
        },
      },
      spec: {
        connectionConfig: {
          url: 'https://netapp.github.io/trident-protect-helm-chart',
        },
        name: 'trident-protect',
      }
    };

    try {
      // Check if namespace exists
      let nsExists = false;
      try {
        await k8sGet({
          model: {
            apiGroup: 'project.openshift.io',
            apiVersion: 'v1',
            kind: 'Project',
            abbr: 'PR',
            label: 'Project',
            labelPlural: 'Projects',
            plural: 'projects',
            namespaced: false,
            crd: true,
          },
          name: 'trident-protect',
        });
        nsExists = true;
        console.log('Namespace already exists');
      } catch (err: any) {
        nsExists = false;
      }

      // If namespace does not exist, create it
      if (!nsExists) {
        await k8sCreate({
          model: {
            apiGroup: 'project.openshift.io',
            apiVersion: 'v1',
            kind: 'Project',
            abbr: 'PR',
            label: 'Project',
            labelPlural: 'Projects',
            plural: 'projects',
            namespaced: false,
            crd: true,
          },
          data: namespaceObj,
        });
        console.log('Namespace created successfully');
      }

      // Check if Helm Chart Repository exists in the namespace
      let helmExists = false;
      try {
        await k8sGet({
          model: {
            apiGroup: 'helm.openshift.io',
            apiVersion: 'v1beta1',
            kind: 'ProjectHelmChartRepository',
            abbr: 'PHCR',
            label: 'ProjectHelmChartRepository',
            labelPlural: 'ProjectHelmChartRepositories',
            plural: 'projecthelmchartrepositories',
            namespaced: true,
            crd: true,
          },
          name: 'trident-protect',
          ns: 'trident-protect',
        });
        helmExists = true;
        console.log('Helm Chart Repository already exists');
      } catch (err: any) {
        helmExists = false;
      }

      // If Helm Chart Repository does not exist, create it
      if (!helmExists) {
        await k8sCreate({
          model: {
            apiGroup: 'helm.openshift.io',
            apiVersion: 'v1beta1',
            kind: 'ProjectHelmChartRepository',
            abbr: 'PHCR',
            label: 'ProjectHelmChartRepository',
            labelPlural: 'ProjectHelmChartRepositories',
            plural: 'projecthelmchartrepositories',
            namespaced: true,
            crd: true,
          },
          data: helmChart,
        });
        console.log('Trident Protect Helm Chart created successfully');
      }

      onClose();
    } catch (err) {
      console.error('Failed to create Helm Chart resources:', err);
    }
  };

  const handleCancel = () => {
    setName('trident-protect');
    setNamespace('trident-protect');
    setUrl('https://netapp.github.io/trident-protect-helm-chart');
    setChartName('trident-protect')
    onClose();
  };

  return (
    <Modal
      aria-label="Create Helm Chart Repository"
      variant="medium"
      title="Project Helm Chart Repository"
      isOpen={isOpen}
      onClose={handleCancel}
      actions={[
        <Button 
          key="create" 
          variant="primary" 
          onClick={handleSubmit}
          isDisabled={!name}
        >
          Create
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      ]}
    >
      <Form>
        <FormGroup label="Name" isRequired fieldId="helm-name">
          <TextInput
            id="helm-name"
            value={name}
            onChange={(_event, val) => setName(val)}
            isRequired
          />
        </FormGroup>
        <FormGroup label="Namespace" isRequired fieldId="helm-namespace">
          <TextInput
            id="helm-namespace"
            value={namespace}
            readOnlyVariant='default'
            isRequired
          />
        </FormGroup>
        <FormGroup label="URL" fieldId="helm-url">
          <TextInput
            id="helm-url"
            value={url}
            readOnlyVariant='default'
            isRequired
          />
        </FormGroup>
        <FormGroup label="Description" fieldId="helm-description">
          <TextInput
            id="helm-description"
            value={chartName}
            readOnlyVariant='default'
            isRequired
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default SusanooTridentProtectHelmForm;