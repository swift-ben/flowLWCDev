/**
 * Created by bswif on 3/7/2022.
 */
/*
    contains methods to support FlowRecordForm lwcs
 */
public with sharing class FlowRecordFormHelper {

    //return a list of sobjects
    @AuraEnabled(Cacheable=true)
    public static List<ObjectWrapper> getObjects(){
        List<ObjectWrapper> objList = new List<ObjectWrapper>();
        for(String theName : Schema.getGlobalDescribe().keySet()) {
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(theName);
            String name = objType.getDescribe().getName();
            String label = objType.getDescribe().getLabel();
            if (!name.containsIgnoreCase('history') && !name.containsIgnoreCase('tag') &&
                    !name.containsIgnoreCase('share') && !name.containsIgnoreCase('feed') &&
                    !name.containsIgnoreCase('group') && !name.containsIgnoreCase('public') &&
                    !objType.getDescribe().isCustomSetting() && objType.getDescribe().isCreateable() &&
                    objType.getDescribe().getRecordTypeInfos().size() > 0) {
                objList.add(new ObjectWrapper(name,label));
            }
        }
        objList.sort();
        return objList;
    }

    //method to return an sobject's fields
    @AuraEnabled(Cacheable=true)
    public static List<FieldWrapper> getFields(String objName){
        SObjectType objType = Schema.getGlobalDescribe().get(objName);
        List<FieldWrapper> fldList = new List<FieldWrapper>();
        for(Schema.SObjectField theFld : objType.getDescribe().fields.getMap().values()) {
            if(theFld.getDescribe().isCreateable() && theFld.getDescribe().isUpdateable()) {
                fldList.add(new FieldWrapper(theFld.getDescribe().getName(),theFld.getDescribe().getLabel()));
            }
        }
        fldList.sort();
        return fldList;
    }

    public class ObjectWrapper implements Comparable{
        @AuraEnabled
        public String value {get;set;}
        @AuraEnabled
        public String label {get;set;}

        ObjectWrapper(String value,String label){
            this.value = value;
            this.label = label;
        }

        public Integer compareTo(Object compareTo) {
            ObjectWrapper compareToObj = (ObjectWrapper) compareTo;
            if (label == compareToObj.label) return 0;
            if (label > compareToObj.label) return 1;
            return -1;
        }
    }

    public class FieldWrapper implements Comparable{
        @AuraEnabled
        public String value;
        @AuraEnabled
        public String label;

        FieldWrapper(String theAPIName,String theLabel){
            this.value = theAPIName;
            this.label = theLabel;
        }
        public Integer compareTo(Object compareTo) {
            FieldWrapper compareToFld = (FieldWrapper) compareTo;
            if (label == compareToFld.label) return 0;
            if (label > compareToFld.label) return 1;
            return -1;
        }
    }
}