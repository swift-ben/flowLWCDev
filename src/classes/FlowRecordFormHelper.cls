/**
 * Created by bswif on 3/7/2022.
 */
/*
    contains methods to support FlowRecordForm lwcs
 */
public with sharing class FlowRecordFormHelper {

    //return a list of sobjects
    @AuraEnabled(cacheable=true)
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
                List<FieldWrapper> objFlds = new List<FieldWrapper>();
                for(Schema.SObjectField theFld : objType.getDescribe().fields.getMap().values()){
                    if(theFld.getDescribe().isCreateable() && theFld.getDescribe().isUpdateable()){
                        objFlds.add(new FieldWrapper(theFld.getDescribe().getName(),theFld.getDescribe().getLabel()));
                    }
                }
                objList.add(new ObjectWrapper(name,label,objFlds));
            }
        }
        objList.sort();
        return objList;
    }

    /* not currently being used but may decide to only get fields once object is selected to conserve load time
    @AuraEnabled(cacheable=true)
    public static List<FieldWrapper> getFields(String objName){
        List<FieldWrapper> fldList = new List<FieldWrapper>();
        SObjectType objType = Schema.getGlobalDescribe().get(objName);
        Map<String,Schema.SObjectField> fldMap = objType.getDescribe().fields.getMap();

        for(String fldName : fldMap.keySet()){
            fldList.add(new FieldWrapper(fldName,fldMap.get(fldName).getDescribe().getLabel()));
        }
        return fldList;
    }
    */
    public class ObjectWrapper implements Comparable{
        @AuraEnabled
        public String value {get;set;}
        @AuraEnabled
        public String label {get;set;}
        @AuraEnabled
        public List<FieldWrapper> objFlds {get;set;}

        ObjectWrapper(String value,String label,List<FieldWrapper> objFlds){
            this.value = value;
            this.label = label;
            objFlds.sort();
            this.objFlds = objFlds;
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