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
    @track _recList; //@api wasn't reactive on the form so using two arrays for now and copying the @track to the @api on final submission
    @track isSubmitting = false; //track currently submitting

    //list of fields to display and attributes from the JSON
    get fldObjs(){
        if(this.jsonFlds){
            return JSON.parse(this.jsonFlds);
        }
    }

    //return true when all forms are loaded
    get formsLoaded(){
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
    }

    //copy recList to _recList, set attributes as needed
    connectedCallback(){
        if((this.recList) && !(this._recList)){
            this._recList = [];
            let theCounter = 0;
            for(let theRec of this.recList){
                let cloneRec = Object.assign({},theRec);
                cloneRec.theIndex = theCounter; //index used for editing/removing
                cloneRec.showRemove = !(theRec.Id); //boolean to show remove button
                cloneRec.formLoaded = false; //boolean to set true when form is loaded
                cloneRec.flds = []; //array of fields and values (values set to avoid using id in form to save load)
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
                        showRemove: false,
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
        for(let theRec of this._recList){
            console.log(theRec);
        }
    }

    //handle form loaded
    handleFormLoad(event){
        let theIndex = event.target.dataset.index;
        this._recList[theIndex].formLoaded = true;
    }

    //update field value of item in _recList
    handleFieldUpdate(event){
        let theIndex = event.target.dataset.index;
        this._recList[theIndex][event.target.name] = event.target.value;
    }

    //add new record to _recList and set attributes
    handleAdd(event){
        let theIndex = event.target.dataset.index;
        let newRec={
            theIndex: this._recList.length,
            showRemove: false,
            formLoaded: false
        };
        newRec.flds = [];
        for(let theFldObj of this.fldObjs){
            theFldObj.value = null;
            theFldObj.theId = this._recList.length+theFldObj.apiName;
            newRec.flds.push(theFldObj);
        }
        this._recList.push(newRec);
    }

    //validate fields, assign _recList to recList and fire flow next
    handleNext(event){
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
}