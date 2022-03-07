# flowLWCDev
This repository contains miscellaneous Lightning Web Components for Flow

<h2>Flow Record Form (beta)</h2>
<p>A LWC leveraging lightning-record-edit-form and lightning-layout to expose record edit/create forms to visual flow. Admins can define what fields to display and users have the ability to add additional rows to create new records.</p>
<h3>Configuration Instructions</h3>
<ol>
  <li><a href="https://test.salesforce.com/packaging/installPackage.apexp?p0=04t8c000000ybi9" target="_blank">Install the unmanaged package (Sandbox only for now)</a></li>
  <li>Review the components in the provided Sample Flow</li>
  <li>To configure the LWC
    <ol>
      <li>Add a Screen Component to a Flow</li>
      <li>Drag the Flow Record Form LWC into the Screen</li>
      <li>Wait for the config to load (this may take a minute as the LWC loads all SObjects and fields)</li>
      <li>Use Object Name to select the SObject to provide form(s) for</li>
      <li>Use Record Collection to select the collection of SObject Records from your Flow to edit/insert</li>
        <ul>
          <li>To let users edit existing records and create new ones, use records from a Record Lookup Element</li>
          <li>To only let users create new records, use an empty collection variable</ki>
          <li><b>Important:</b> the SObject type you use in the collection must match the Object Name selected above</li>            
        </ul>
      </li>
      <li>Click "Add/Edit Fields"</li>  
      <li>Use the provided UI to add field to display in the form</li>
        <ul>
          <li>Field: select the field</li>
          <li>Label: customize the label to display on the form (not currently working)</li>
          <li>Required: set the field to be required (not currently working)</li>
          <li>Input Size: define the input size for the field in a grid of 12 columns. See <a href="https://developer.salesforce.com/docs/component-library/bundle/lightning-layout-item/example" target="_blank">lightning-layout-item documentation for more info.</a></li>
        </ul>
      <li>In Advanced, select "Manually assign variables and define a Record Collection for the updated Records to return to your Flow</li>
        <ul>
          <li>If you wish to save the changes made in memory and let users return the component to make additional changes, select the same SOBject Collection you used to input into the LWC</li>
        </ul>
      </li>
    </ol>
  </li>
</ol>
<h3>Coming Soon...</h3>
<ul>
  <li>Custom labels and requiring fields</li>
  <li>Remove fields and records</li>
  <li>Option to disable button to add more records</li>
  <li>lots more...</li>
</ul>
<h3>Caveats</h3>
<ul>
  <li>Using lightning-record-edit-form means that this component is subject to the Permissions and Sharing Settings</li>
  <li>This is currently in beta testing and shouldn't be used in Production</li>
</ul>
