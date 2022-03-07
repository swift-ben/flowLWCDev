/**
 * Created by bswif on 3/7/2022.
 */

@IsTest
private class TEST_FlowRecordFormHelper {

    @IsTest
    static void testGetObjects() {//basic test to pull object metadata
        List<FlowRecordFormHelper.ObjectWrapper> theObjs = FlowRecordFormHelper.getObjects();
        System.assert(theObjs.size()>0);

        Map<String,FlowRecordFormHelper.ObjectWrapper> objMap = new Map<String,FlowRecordFormHelper.ObjectWrapper>();

        for(FlowRecordFormHelper.ObjectWrapper theObj : theObjs){
            objMap.put(theObj.value.toLowerCase(),theObj);
        }

        //do a couple of assertions
        System.assert(objMap.containsKey('contact'));
        FlowRecordFormHelper.ObjectWrapper conObj = objMap.get('contact');
        Set<String> objFieldNames = new Set<String>();
        for(FlowRecordFormHelper.FieldWrapper theFld : conObj.objFlds){
            objFieldNames.add(theFld.value.toLowerCase());
        }

        System.assert(objFieldNames.contains('firstname'));
        System.assert(objFieldNames.contains('lastname'));
        System.assert(objFieldNames.contains('accountid'));
    }
}