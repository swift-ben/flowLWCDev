# flowLWCDev
This repository contains miscellaneous Lightning Web Components for Flow

<h2>Flow Record Form (coming soon)</h2>
<p>A LWC leveraging <lightning-record-edit-form> and <lightning-layout> to expose record edit/create forms to visual flow. Admins can define what fields to display and users have the ability to add additional rows to create new records.</p>
  <h3>Configuration Instructions</h3>
  <ol>
    <li><a href="https://login.salesforce.com/packaging/installPackage.apexp?p0=04t8c000000ybi9" target="_blank">Install the unmanaged package</a></li>
    <li>Review the components in the provided Sample Flow</li>
    <li>To configure the LWC</li>
      <ol>
        <li>Add a Screen Component to a Flow</li>
        <li>Drag the Flow Record Form LWC into the Screen</li>
        <li>Wait for the config to load (this may take a minute as the LWC loads all SObjects and Fields)</li>
        <li>Use Object Name to select the SObject to provide form(s) for</li>
        <li>Use Record Collection to select the collection of SObject Records from your Flow to edit/insert</li>
          <ul>
            <li>To let users edit existing records and create new ones, use records from a Record Lookup Element</li>
            <li>To only let users create new records, use an empty collection variable</ki>
            <li><b>Important:</b> the SObject type of collection you use must match the Object Name selected above</li>            
          </ul>
        </li>
        <li>Click "Add/Edit Fields"</li>  
        <li>Use the provided UI to add field to display in the form</li>
      </ol>
  </ol>
  <h3>Coming Soon...</h3>
  
  <h3>Caveats</h3>

