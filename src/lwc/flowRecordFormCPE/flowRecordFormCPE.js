/**
 * Created by bswif on 3/7/2022.
 */

/*
    notes: this custom property editor passes:
        - a sobject name for lightning-record-edit-form
        - json string of fields to display with attributes in form
        - a collection of records from the flow to display
*/

import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjects from '@salesforce/apex/FlowRecordFormHelper.getObjects';

export default class FlowRecordFormCpe extends LightningElement {
    @track isLoading = true; //show spinner while loading
    objFldMap; //map of sobjects to their fields
    @track objOpts; //list of sobjects
    @track fldOpts; //list of sobject fields
    @track showAddFlds; //boolean to show add/edit fields opener
    @track flds; //submitted fields from the add/edit fields modal
    @track _flds; //temp flds array to hold edits before submitting
    @track fldSizeOpts = [] //list of input sizes
    @track fldsErrMsg; //error to show on fields modal
    @track noFldsErrMsg; //error on submit if they didn't add fields
    @track isSubmitting = false; //show spinner on button submits;

    @api builderContext; //flow builder context with variables, collections, etc...

    //get and set flow input variables
    _inputVariables = [];
    @api
    get inputVariables() {
        return this._inputVariables;
    }
    set inputVariables(value) {
        this._inputVariables = value || [];
    }

    //get and set flow output variables
   _automaticOutputVariables;
    @api
    get automaticOutputVariables() {
        return this._automaticOutputVariables;
    }
    set automaticOutputVariables(value) {
        this._automaticOutputVariables = value;
    }

    //set spinner
    get showSpinner(){
        return this.isLoading || this.isSubmitting;
    }

    //boolean to display the add/edit fields button when we have an object selected
    get showAddFldsButton(){
        return (this.objFldMap) && (this.objName);
    }

   //boolean to display reclists once object has been selected
    get showOpts(){
        return (this.objName);
    }

    //get record collections from flow
    get recLists(){
      let theRecLists = [];
      //check variables
       for(let theElmt of this.builderContext.variables){
            if(theElmt.dataType == 'SObject' && theElmt.isCollection){
                theRecLists.push(
                    {
                        sObject: theElmt.objectType,
                        varName: theElmt.name,
                        theVar: theElmt
                    }
                );
            }
       }
       //check record lookups
       for(let theElmt of this.builderContext.recordLookups){
                theRecLists.push(
                    {
                        sObject: theElmt.objectType,
                        varName: theElmt.name,
                        theVar: theElmt
                    }
                );
       }
       return theRecLists;
   }

   //set record list options for custom property editor
   get recListOpts(){
       let theOpts = [];
       for(let theList of this.recLists){
           theOpts.push(
               {
                   label: theList.varName,
                   value: theList.varName
                }
           );
       }
       return theOpts;
   }

    //get the objName input variable
    get objName() {
        const param = this.inputVariables.find(({name}) => name === 'objName');
        this.isLoading = false;
        return param && param.value;
    }

    // Get the jsonFlds input variable
    get jsonFlds() {
        const param = this.inputVariables.find(({name}) => name === 'jsonFlds');
        return param && param.value;
    }

    //get the recList input variable
    get recList(){
        const inputParam = this.inputVariables.find(({name}) => name === 'recList');
        if(inputParam){
            return inputParam && inputParam.value;
        }
    }

    //if we have jsonFlds already, assign them to the flds array, otherwise instantiate the flds array
    connectedCallback(){
        if(this.jsonFlds){
            this.flds = JSON.parse(this.jsonFlds);
        }else if(!(this.flds)){
            this.flds=[
                {
                    apiName:'',
                    theIndex:0
                }
            ]
        }

        //set field size options
        for(let i = 1; i < 13; i++){
            this.fldSizeOpts.push(
                {
                    label: i.toString(),
                    value: i.toString()
                }
            );
        }
    }

    //get all sobject and fields and popluate objectFldMap
    @wire(getObjects)
    wiredObjs({data,error}){
        if(data){
            this.objOpts = [];
            this.objFldMap = new Map();
            for(let theObj of data){
                this.objOpts.push(
                        {
                            value: theObj.value,
                            label: theObj.label
                        }
                );
                this.objFldMap.set(theObj.value,theObj.objFlds);
            }
            if(this.objName){
                this.fldOpts = this.objFldMap.get(this.objName);
            }
        }else if(error){
            //todo handle this
        }
    }

    //handle changing the sobject, includes clearing fields, updating available fields and sending the new object name to the form lwc
    handleObjChange(event) {
        if (event && event.detail) {
            //set object name
            const newObj = event.detail.value;
            //set field options
            this.fldOpts = this.objFldMap.get(newObj);
            //set flds array
            this.flds = [
                {
                    theIndex: 0
                }
            ];
            this.fldsErrMsg = null;
            //send updated input property to parent lwc
            this._dispatchInputChanged('objName',newObj,'String');

            //send updated input type property to parent lwc
            const typeChangedEvent = new CustomEvent(
                'configuration_editor_generic_type_mapping_changed',
                {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        typeName: 'theObj',
                        typeValue: newObj
                    },
                }
            );
            this.dispatchEvent(typeChangedEvent);
        }
    }

    //handle changing the recList input, includes sending update to parent lwc
    handleRecListChange(event) {
        if (event && event.detail) {
            const newValue = event.detail.value;
            this._dispatchInputChanged('recList',newValue,'reference');
        }
    }

    //method to show/hide fld modal
    toggleAddFld(event){
        this.showAddFlds = !this.showAddFlds;
            if(this.showAddFlds){
                this._flds = [];
                for(let theFld of this.flds){
                    this._flds.push(Object.assign({},theFld));
            }
        }
    }

    //handle adding a field to the flds array
    handleAddFld(event){
        this._flds.push(
            {
                apiName: '',
                theIndex: this._flds.length
            }
        );
    }

    //handle a field being added or updated, set to json and send to parent lwc
    handleFldChange(event) {
        if (event && event.detail) {
            const theIndex = event.target.dataset.index;
            this._flds[theIndex][event.target.name] = event.target.value;
        }
    }

    //handle submitted updated fields and sending to the parent lwc
    handleSubmitFlds(event){
        this.isSubmitting = true;
        this.fldsErrMsg = null;
        let errMsg;
        //first validate inputs
        let isValid = [...this.template.querySelectorAll('lightning-input,lightning-combobox')]
                         .reduce((validSoFar, inputCmp) => {
                             inputCmp.reportValidity();
                             return validSoFar && inputCmp.checkValidity();
                         }, true);

        //make sure they didn't enter the same field twice
        if(isValid){
            let fldNames = [];
            for(let theFld of this._flds){
                if(fldNames.includes(theFld.apiName)){
                    isValid = false;
                    this.fldsErrMsg = 'You can\'t submit the same field twice','error';
                    break;
                }else{
                    fldNames.push(theFld.apiName);
                }
            }
        }else{
            this.fldsErrMsg = 'One or more required field attributes are missing';
        }

        if(isValid){
            this.isSubmitting = false;
            this.fldsErrMsg = null;
            this.flds = this._flds;
            const newValue = JSON.stringify(this.flds);
            this._dispatchInputChanged('jsonFlds',newValue,'String');
            this.toggleAddFld();
        }else{
            this.isSubmitting = false;
        }
    }

   //validation method, runs when Done is clicked in lwc config
    @api
    validate() {
        this.noFldsErrMsg = false;
        //check required fields and SObject fields
        const validity = [];

        const fldsValid = [...this.template.querySelectorAll('lightning-input,lightning-combobox')]
                         .reduce((validSoFar, inputCmp) => {
                             inputCmp.reportValidity();
                             return validSoFar && inputCmp.checkValidity();
                         }, true);

        if(!fldsValid){
            validity.push({
                key: 'Missing Required Fields',
                errorString: 'You are missing one or more required fields'
            })
        }else if(!(this.flds) || this.flds.length == 0 || !(this.flds[0].apiName)){
            this.noFldsErrMsg = true;
            validity.push({
                key: 'Missing SObject Fields',
                errorString: 'Add SObject Fields'
            })
        }
        return validity;
    }

    //function to send input property updates to parent lwc
    _dispatchInputChanged(name,newValue,dataType){
        this.dispatchEvent(new CustomEvent(
            'configuration_editor_input_value_changed', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    name: name,
                    newValue: newValue,
                    newValueDataType: dataType
                }
            }
        ));
    }
}