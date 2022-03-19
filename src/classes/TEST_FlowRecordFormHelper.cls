/**
 * Created by bswif on 3/7/2022.
 */

@IsTest
private class TEST_FlowRecordFormHelper {

    @IsTest
    static void testGetObjects() {//test getting object metadata
        List<FlowRecordFormHelper.ObjectWrapper> theObjs = FlowRecordFormHelper.getObjects(new List<String>{'Account','Contact'});
        System.assertEquals(2,theObjs.size());

        Map<String,FlowRecordFormHelper.ObjectWrapper> objMap = new Map<String,FlowRecordFormHelper.ObjectWrapper>();

        for(FlowRecordFormHelper.ObjectWrapper theObj : theObjs){
            objMap.put(theObj.value.toLowerCase(),theObj);
        }

        //do a couple of assertions
        System.assert(objMap.containsKey('contact'));
        System.assert(objMap.containsKey('account'));
    }

    @IsTest
    static void testGetFields(){//test getting field metadata
        List<FlowRecordFormHelper.FieldWrapper> theFlds = FlowRecordFormHelper.getFields('Contact');
        Set<String> objFieldNames = new Set<String>();

        for(FlowRecordFormHelper.FieldWrapper theFld : theFlds){
            objFieldNames.add(theFld.value.toLowerCase());
        }

        //do a couple of assertions
        System.assert(objFieldNames.contains('firstname'));
        System.assert(objFieldNames.contains('lastname'));
        System.assert(objFieldNames.contains('accountid'));
    }
}