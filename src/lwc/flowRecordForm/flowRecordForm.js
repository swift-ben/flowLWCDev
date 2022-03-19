/**
 * Created by bswif on 3/7/2022.
 */

import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class FlowRecordForm extends LightningElement {
    @api objName; //sobject name for form passed from custom property editor
    @api jsonFlds; //json of fields and attributes for the form passed from custom property editor
    @api recList; //the record collection passed into the lwc from flow
    @api allowDel; //allow option to mark records for deletion
    @api delRecList; //list of records to delete
    @api hideAdd; //hide the add button on forms;
    @track _recList; //@api wasn't reactive on the form so using two arrays for now and copying the @track to the @api on final submission
    @track isSubmitting = false; //track currently submitting
    @track showErr = false; //boolean to disable buttons on error
    @track genErrMsg; //general error to display from catches

    //list of fields to display and attributes from the JSON
    get fldObjs(){
        if(this.jsonFlds){
            return JSON.parse(this.jsonFlds);
        }
    }

    //return true when all forms are loaded
    get formsLoaded(){
        try{
            let allLoaded = true;
            if(this._recList){

                for(let theRec of this._recList){
                    if(!theRec.formLoaded){
                        allLoaded = false;
                        break;
                    }
                }
            }else{
                allLoaded = false;
            }
            return allLoaded;
        }catch(error){
            this.logErr(error,'error on formsLoaded');
        }
    }

    //copy recList to _recList, set attributes as needed
    connectedCallback(){
        try{
            if(this.allowDel) this.delRecList = [];//set delRecList
            if((this.recList) && !(this._recList)){
                this._recList = [];
                let theCounter = 0;

                for(let theRec of this.recList){
                    let cloneRec = Object.assign({},theRec);
                    cloneRec.theIndex = theCounter; //index used for editing/removing
                    cloneRec.showRemove = (!(theRec.Id) || this.allowDel); //boolean to show remove button for instantiated records only or all if allowDel is true
                    cloneRec.removeId = theCounter.toString()+'Remove';//id for remove icon
                    cloneRec.formLoaded = false; //boolean to set true when form is loaded
                    cloneRec.flds = []; //array of fields and values (values set to avoid using id in form to speed up form load)

                    for(let theFldObj of this.fldObjs){ //set fields, values and id for labels
                        theFldObj.value = theRec[theFldObj.apiName];
                        theFldObj.theId = theCounter+theFldObj.apiName
                        cloneRec.flds.push(theFldObj);
                    }
                    theCounter++;
                    this._recList.push(cloneRec);
                }
            }else{
                if(!(this._recList)){
                    this._recList = [];
                    let newRec = {
                            theIndex: 0,
                            showRemove: true,
                            removeId: '0Remove',
                            formLoaded: false
                    };
                    newRec.flds = [];

                    for(let theFldObj of this.fldObjs){
                        theFldObj.value = null;
                        theFldObj.Id = newRec.theIndex+theFldObj.apiName;
                        newRec.flds.push(theFldObj);
                    }
                    this._recList.push(newRec);
                }
            }
        }catch(error){
            this.logErr(error,'error on callback');
        }
    }

    //handle form loaded
    handleFormLoad(event){
        try{
            let theIndex = event.target.dataset.index;
            this._recList[theIndex].formLoaded = true;
        }catch(error){
            this.logErr(error,'error on handleFormLoad');
        }
    }

    //update field value of item in _recList
    handleFieldUpdate(event){
        try{
            let theIndex = event.target.dataset.index;
            this._recList[theIndex][event.target.name] = event.target.value;

            //set the value on the corresponding item in the flds array as well to maintain value on form
            for(let theFldObj of this._recList[theIndex].flds){
                theFldObj.value = this._recList[theIndex][theFldObj.apiName];
            }
        }catch(error){
            this.logErr(error,'error on handleFieldUpdate');
        }
    }

    //add new record to _recList and set attributes
    handleAdd(event){
        try{
            let newRec={
                theIndex: this._recList.length,
                showRemove: true,
                removeId: this._recList.length.toString()+'Remove',
                formLoaded: false
            };
            newRec.flds = [];

            for(let theFldObj of this.fldObjs){
                theFldObj.value = null;
                theFldObj.theId = this._recList.length+theFldObj.apiName;
                newRec.flds.push(theFldObj);
            }
            this._recList.push(newRec);
        }catch(error){
            this.logErr(error,'error on handleAdd');
        }
    }

    //handle removing record
    handleRemove(event){
        try{
            let theIndex = event.target.dataset.index;

            //add record to delRecList if needed
            if(this.allowDel && (this._recList[theIndex].Id)) this.delRecList.push(Object.assign({},this._recList[theIndex]));

            //remove record from _recList and reset indexes
            this._recList.splice(theIndex,1);

            for(let i = 0; i < this._recList.length; i++){
                this._recList[i].theIndex = i;
                this._recList[i].showRemove = (!(this._recList[i].Id) || this.allowDel);
                this._recList[i].removeId = i.toString()+'Remove';
                for(let theFldObj of this._recList[i].flds){
                    theFldObj.theId = i.toString()+theFldObj.apiName;
                }
            }
        }catch(error){
            this.logErr(error,'error on handleRemove');
        }
    }

    //validate fields, assign _recList to recList and fire flow next
    handleNext(event){
        try{
            this.isSubmitting = true;
            let isValid = true;

            for(let inputFld of this.template.querySelectorAll('lightning-input-field')){
                isValid = isValid && inputFld.reportValidity();
                inputFld.reportValidity();
            }

            if(isValid){
                this.recList = this._recList;
                const navigateNextEvent = new FlowNavigationNextEvent();
                this.dispatchEvent(navigateNextEvent);
            }else{
                this.isSubmitting = false;
                this.showMsg('Error','One or more required fields are missing','error');
            }
        }catch(error){
            this.logErr(error,'error on handleNext');
        }
    }

    //function to show toast
    showMsg(msgTitle,msgMsg,msgVar,msgMode){
        const event = new ShowToastEvent({
            title: msgTitle,
            message: msgMsg,
            variant: msgVar,
            mode: msgMode
        });
        this.dispatchEvent(event);
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