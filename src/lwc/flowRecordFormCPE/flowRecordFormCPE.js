/**
 * Created by bswif on 3/7/2022.
 */

/*
    notes: this custom property editor passes:
        - a sobject name for lightning-record-edit-form
        - json string of fields to display with attributes in form
        - a collection of records from the flow to display
*/

import { LightningElement, api, track } from 'lwc';
import getObjects from '@salesforce/apex/FlowRecordFormHelper.getObjects';
import getFields from '@salesforce/apex/FlowRecordFormHelper.getFields';

export default class FlowRecordFormCpe extends LightningElement {
    @track fldOpts; //list of sobject fields
    varObjMap = new Map(); //map flow vars to object names and use to get sobject from recList when changed
    fldLabelMap = new Map(); //map of field names to labels to default label on field select
    objLabelMap = new Map(); //map of object names to labels for collection labels
    @track showAddFlds; //boolean to show add/edit fields opener
    @track flds; //submitted fields from the add/edit fields modal
    @track _flds; //temp flds array to hold edits before submitting
    fldSizeOpts = [] //list of input sizes
    @track isLoading = true;// boolean to clear when variables have loaded
    @track showErr = false;//boolean to stop spinner when an error is hit
    @track genErrMsg; //general error to display from catches
    @track fldsErrMsg; //error to show on fields modal
    @track fldsSizeErrMsg; //error to show on fields modal
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
        return this.showErr==false && (this.isLoading || this.isSubmitting);
    }

    //boolean to display the add/edit fields button when we have an object and collection selected
    get showAddFldsButton(){
        return (this.fldOpts) && (this.objName) && (this.recList);
    }

    //boolean to show error message on adding fields
    get showFldError(){
        return ((this.fldsErrMsg) || (this.fldsSizeErrMsg));
    }

    //get the objName input variable
    get objName() {
        const param = this.inputVariables.find(({name}) => name === 'objName');
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

    //get the hideAdd input variable
    get hideAdd(){
        const inputParam = this.inputVariables.find(({name}) => name === 'hideAdd');
        if(inputParam){
            return inputParam && inputParam.value;
        }
    }

    //run on load
    connectedCallback(){
        try{
            //if we have jsonFlds from input, parse them into flds array for field modal
            if(this.jsonFlds){
                this.flds = JSON.parse(this.jsonFlds);
                for(let i = 0; i < this.flds.length; i++){
                    this.flds[i].showRemove = i != 0;
                }
            }else if(!(this.flds)){//otherwise, instantiate flds array for modal
                this.flds=[
                    {
                        apiName:'',
                        theIndex:0,
                        showRemove:false
                    }
                ]
            }

            //if we have objName from input, call method to get available sObject fields
            if(this.objName){
                this.handleObjChange(this.objName);
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

            //call set recListOpts to build recListOpts for combobox
            this.setRecLists();
        }catch(error){
            this.logErr(error,'error on callback');
        }
    }

    //load needed attributes from connectedcallback
    @track recListOpts;
    setRecLists(){
        try{
            let recLists = [];//array of record collections from flow
            let objNames = [];//array of sobject names from flow record collections

            //check variables for record collections
            for(let theElmt of this.builderContext.variables){
                if(theElmt.dataType == 'SObject' && theElmt.isCollection){
                    recLists.push(
                        {
                            sObject: theElmt.objectType,
                            varName: theElmt.name,
                            theVar: theElmt
                        }
                    );
                    //add to objNames to get labels
                    if(!objNames.includes(theElmt.objectType)) objNames.push(theElmt.objectType);
                }
            }

            //check record lookups for record collections
            for(let theElmt of this.builderContext.recordLookups){
                recLists.push(
                    {
                        sObject: theElmt.object,
                        varName: theElmt.name,
                        theVar: theElmt
                    }
                );
                //add to objNames to get labels
                if(!objNames.includes(theElmt.object)) objNames.push(theElmt.object);
           }

            //get object information for sobjects
            getObjects({objNames: objNames})
            .then(result => {
                //pass sobject label/names into map
                for(let theOpt of result){
                    this.objLabelMap.set(theOpt.value,theOpt.label);
                }

                //set options for recList combobox (use object label from map for label)
                this.recListOpts = [];
                for(let theList of recLists){
                    this.recListOpts.push(
                        {
                            label: `${this.objLabelMap.get(theList.sObject)}s from ${theList.varName}`,
                            value: theList.varName
                        }
                    );
                    this.varObjMap.set(theList.varName,theList.sObject);//set varObjMap
                }

                //show error if there are no valid collection variables
                if(this.recListOpts.length == 0){
                    this.genErrMsg = '<p style="color:red;">This component requires at least one SObject collection variable</p>';
                    this.showErr = true;
                }else{
                    this.setIsLoading();
                }
            })
            .catch(error => {
                this.logErr(error,'error getting objects');
            });
        }catch(error){
            this.logErr(error,'error on setRecLists');
        }
    }


    //handle changing the recList input, includes sending update to parent lwc
    handleRecListChange(event) {
        try{
            if (event && event.detail) {
                this.isSubmitting = true;

                //if the new collection is a different sobject
                if(this.objName != this.varObjMap.get(event.detail.value)){
                    //clear submitted fields
                    this.flds = [
                        {
                            theIndex: 0,
                            showRemove: false
                        }
                    ];
                    //call method updated available fields and sending objName and objType to parent
                    this.handleObjChange(this.varObjMap.get(event.detail.value));
                }

                //send new record collection to parent
                const newValue = event.detail.value;
                this._dispatchInputChanged('recList',newValue,'reference');
                this.isSubmitting = false;
            }
        }catch(error){
            this.logErr(error,'error on handleRecListChange');
        }
    }

    //handle changing the sobject
    handleObjChange(newObjName) {
        //set object name
        const newObj = newObjName;

        //get available fields for sobject and set in fldOpts
        getFields({objName: newObj})
        .then(result => {
            for(let theOpt of result){
                this.fldLabelMap.set(theOpt.value,theOpt.label);
            }
            this.fldOpts = result;

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
            this.fldsErrMsg = null;//clear fields err msg
            this.setIsLoading();
        })
        .catch(error => {
            this.logErr(error,'error getting fields');
        });
    }

    //handle changing the hideAdd input, includes sending update to parent lwc
    handleHideAddChange(event) {
        try{
            if (event && event.detail) {
                const newValue = event.target.checked;
                this._dispatchInputChanged('hideAdd',newValue,'Boolean');
            }
        }catch(error){
            this.logErr(error,'error on handleHideAddChange');
        }
    }

    //method to show/hide field modal
    toggleAddFld(event){
        try{
            this.showAddFlds = !this.showAddFlds;
            this.fldsErrMsg = null;
            if(this.showAddFlds){
                this._flds = [];

                for(let theFld of this.flds){
                    this._flds.push(Object.assign({},theFld));
                }
            }
        }catch(error){
            logErr(error, 'error on toggleAddFld');
        }
    }

    //handle adding a field to the flds array
    handleAddFld(event){
        try{
            this._flds.push(
                {
                    apiName: '',
                    theIndex: this._flds.length,
                    showRemove: this._flds.length != 0
                }
            );
        }catch(error){
            this.logErr(error,'error on handleAddFld');
        }
    }

    //handle removing a field from the flds array
    handleRemoveFld(event){
        try{
            if(event && event.detail){
                const theIndex = event.target.dataset.index;
                this._flds.splice(theIndex,1);

                for(let i = 0; i < this._flds.length; i++){
                    this._flds[i].theIndex = i;
                    this._flds[i].showRemove = i != 0;
                }
            }
        }catch(error){
            this.logErr(error,'error on handleRemoveFld');
        }
    }

    //handle a field being added or updated
    handleFldChange(event) {
        try{
            if (event && event.detail) {
                //set field attribute
                const theIndex = event.target.dataset.index;

                if(event.target.type == "checkbox"){
                    this._flds[theIndex][event.target.name] = event.target.checked;
                }else{
                    this._flds[theIndex][event.target.name] = event.target.value;
                }

                //show size warning
                let sizeCount = 0;
                for(let theFld of this._flds){
                    sizeCount += parseInt(theFld.fldSize);
                }
                if(sizeCount > 11){
                    this.fldsSizeErrMsg = 'Your selected field size will result in the form displaying on multiple rows. Test and review before publishing.';
                }else{
                    this.fldsSizeErrMsg = null;
                }

                //if the apiName was updated, default the label
                if(event.target.name == 'apiName'){
                    this._flds[theIndex].theLabel = this.fldLabelMap.get(event.target.value);
                }
            }
        }catch(error){
            this.logErr(error,'error on handleFldChange');
        }
    }

    //handle submitted updated fields and sending to the parent lwc
    handleSubmitFlds(event){
        try{
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

            //construct json from flds and send to parent lwc
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
        }catch(error){
            this.logErr(error,'error on handleSubmitFlds');
        }
    }

   //validation method, runs when Done is clicked in lwc config
    @api
    validate() {
        try{
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
        }catch(error){
            this.logErr(error,'error on validate');
        }
    }

    //set is loading to false once recListOpts and objName/fldOpts have loaded
    setIsLoading(){
        this.isLoading = (!(this.recListOpts) || (this.objName && !(this.fldOpts)));
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

    //function to log errors from try/catches
    logErr(error,logMsg){
        console.log('caught err');
        console.log(logMsg);
        console.log(error.message);
        console.log(error);
        this.genErrMsg = `<p style="color:red;">Something went wrong. Send message below to developer:</p><br/><p style="color:red;">${logMsg}</p><br/><p style="color:red;">${error.message}</p>`;
        this.showErr = true;
    }
}