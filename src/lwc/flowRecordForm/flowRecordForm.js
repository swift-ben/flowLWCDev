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
                cloneRec.showRemove = !(theRec.Id) && theCounter != 0; //boolean to show remove button for instantiated records only
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
                        showRemove: false,
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
        //set the value on the corresponding item inf the flds array as well to maintain value on form
        for(let theFldObj of this._recList[theIndex].flds){
            theFldObj.value = this._recList[theIndex][theFldObj.apiName];
        }
    }

    //add new record to _recList and set attributes
    handleAdd(event){
        let newRec={
            theIndex: this._recList.length,
            showRemove: this._recList.length != 0,
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
    }

    //handle removing record
    handleRemove(event){
        let theIndex = event.target.dataset.index;
        this._recList.splice(theIndex,1);
        for(let i = 0; i < this._recList.length; i++){
            this._recList[i].theIndex = i;
            this._recList[i].showRemove = !(this._recList[i].Id) && i != 0;
            this._recList[i].removeId = i.toString()+'Remove';
            for(let theFldObj of this._recList[i].flds){
                theFldObj.theId = i.toString()+theFldObj.apiName;
            }
        }
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