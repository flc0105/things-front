<template>
  <div>
    <!-- 按钮 -->
    <el-button type="primary" @click="showAddDialog(false)">Add Item</el-button>
    <el-button @click="getItems">Refresh</el-button>
    <el-popover
      :visible="customFilterPopoverVisible"
      placement="bottom"
      title="Custom Filter"
      :width="200"
    >
      <template #default>
        <el-cascader
          v-model="cascaderValue"
          :options="formattedCustomFieldValues"
          :props="props"
          @change="handleChange"
          clearable
          @clear="handleCascaderClear"
        />
      </template>
      <template #reference>
        <el-button
          class="m-2"
          @click="customFilterPopoverVisible = !customFilterPopoverVisible"
        >
          Custom Filter
        </el-button>
      </template>
    </el-popover>

  

    <!-- 表格 -->
    <el-table
      :data="filterTableData"
      style="width: 100%"
      :default-sort="{ prop: 'date', order: 'descending' }"
      show-summary

      id="el-table"
      row-key="id"
      
    ><!--:tree-props="{ children: 'children', hasChildren: 'hasChildren' }"-->
      <el-table-column label="#">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <el-table-column
        prop="name"
        label="Name"
        title="name"
        width="300"
        sortable
      >
        <template #default="scope">
          <el-popover
            effect="light"
            trigger="hover"
            placement="top"
            width="auto"
            :title="scope.row.name"
            :content="scope.row.remark"
            v-if="scope.row.remark != null && scope.row.remark != ''"
          >
            <template #reference>
              {{ scope.row.name }}
            </template>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column prop="price" label="Price" sortable></el-table-column>
      <el-table-column prop="purchaseDate" label="Purchase Date" sortable>
        <template #default="scope">
          <el-popover
            effect="light"
            trigger="hover"
            placement="right"
            width="400"
            :title="scope.row.name"
            v-if="
              scope.row.timelineEvents != null &&
              scope.row.timelineEvents.length != 0
            "
          >
            <div style="margin-top: 30px">
              <el-timeline>
                <el-timeline-item
                  v-for="(activity, index) in scope.row.timelineEvents"
                  :key="index"
                  :timestamp="activity.date"
                >
                  {{ activity.eventDescription }}
                </el-timeline-item>
              </el-timeline>
            </div>
            <template #reference>
              {{ scope.row.purchaseDate }}
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="ownershipDuration" label="Ownership Duration">
        <template #default="scope">
          <el-text
            :style="{ color: scope.row.status === 'SOLD' ? 'gray' : '' }"
          >
            {{ scope.row.ownershipDuration }}
          </el-text>
        </template>
      </el-table-column>

      <el-table-column
        prop="averageDailyPrice"
        label="Average Daily Price"
        sortable
      >
        <template #default="scope">
          <el-text
            :style="{ color: scope.row.status === 'SOLD' ? 'gray' : '' }"
          >
            {{ scope.row.averageDailyPrice }}
          </el-text>
        </template>
      </el-table-column>

      <el-table-column
        label="Category"
        :filters="categoriesFilters"
        :filter-method="categoryFilterHandler"
      >
        <template #default="{ row }">
          <el-tag style="margin-right: 5px" v-if="row.category">{{
            row.category.name
          }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="Status"
        :filters="itemStatusFilters"
        :filter-method="itemStatusFilterHandler"
      >
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'NORMAL' ? 'success' : 'danger'"
            style="margin-right: 5px"
            v-if="row.statusStr"
            >{{ row.statusStr }}</el-tag
          >
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="Operations" width="160">
        <template #header>
          <el-input
            v-model="search"
            size="small"
            placeholder="Type to search"
          />
        </template>

        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="editItem(row)"
            >Edit</el-button
          >

          <el-popconfirm title="确定要删除吗？" @confirm="deleteItem(row.id)">
            <template #reference>
              <el-button link type="primary" size="small">Delete</el-button>
            </template>
          </el-popconfirm>

          <el-button
            link
            type="primary"
            size="small"
            @click="
              getDetails(row.id);
              drawer = true;
            "
            >Details</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? 'Edit Item' : 'Add Item'"
    >
      <el-form :model="newItem" ref="newItemForm" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="newItem.name"></el-input>
        </el-form-item>
        <el-form-item label="Price" prop="price">
          <el-input v-model="newItem.price"></el-input>
        </el-form-item>
        <el-form-item label="Purchase Date" prop="purchaseDate">
          <el-date-picker
            v-model="newItem.purchaseDate"
            type="date"
            placeholder="Select Date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="Category">
          <el-select
            v-model="newItem.categoryId"
            filterable
            clearable
            default-first-option
            :reserve-keyword="false"
          >
            <el-option
              v-for="cat in categoriesFilters"
              :key="cat.id"
              :label="cat.text"
              :value="cat.id"
            ></el-option>
            <!--添加分类 开始-->
            <template #footer>
              <el-button
                v-if="!isAdding"
                text
                bg
                size="small"
                @click="onAddOption"
              >
                Add an option
              </el-button>
              <template v-else>
                <el-input
                  v-model="optionName"
                  class="option-input"
                  placeholder="input option name"
                  size="small"
                />
                <el-button type="primary" size="small" @click="onConfirm">
                  confirm
                </el-button>
                <el-button size="small" @click="clear">cancel</el-button>
              </template>
            </template>
            <!--添加分类 结束-->
          </el-select>
        </el-form-item>

        <el-form-item label="Status">
          <el-select
            v-model="newItem.status"
            filterable
            clearable
            default-first-option
            :reserve-keyword="false"
          >
            <el-option
              v-for="status in itemStatusFilters"
              :key="status.id"
              :label="status.text"
              :value="status.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Remark" prop="remark">
          <el-input
            v-model="newItem.remark"
            style="width: 500px"
            :rows="3"
            type="textarea"
            placeholder=""
          />
        </el-form-item>

        <!--attachments-->
        <el-form-item label="Attachment">
          <el-upload
            drag
            action="/api/attachments"
            limit="1"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleUploadFileRemove"
            :on-exceed="handleUploadExceed"
            v-model:file-list="fileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              Drop file here or <em>click to upload</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                <el-link
                  style="font-size: 12px"
                  v-if="newItem.attachmentId"
                  :underline="false"
                  type="primary"
                  :href="'/api/attachments/' + newItem.attachmentId"
                >
                  {{ "Selected file:" + newItem.attachmentName }}
                </el-link>

                <el-popconfirm
                  title="会同步删除服务器上的文件，确定要删除吗？"
                  @confirm="deleteAttachment(newItem.attachmentId)"
                >
                  <template #reference>
                    <el-button
                      :icon="Delete"
                      type="danger"
                      size="small"
                      style="margin-left: 8px"
                      circle
                      v-if="newItem.attachmentId"
                    />
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item v-if="isSubItem" label="Parent item" prop="parentId">
          <el-select
            v-model="newItem.parentId"
            filterable
            placeholder="Select parent item"
          >
            <el-option
              v-for="item in items"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            @click="editMode ? updateItem() : addItem()"
          >
            {{ editMode ? "Update" : "Add" }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 抽屉 -->
    <el-drawer
      v-model="drawer"
      :direction="direction"
      title="Details"
      size="50%"
    >
      <template #default>
        <h4 style="margin: 0 0 30px 0">Timeline events</h4>

        <el-empty v-if="timelineEvents.length == 0" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="(activity, index) in timelineEvents"
            :key="index"
            :timestamp="activity.date"
          >
          <!-- <span v-if="activity.eventType">
       
          {{         dictOptions["EVENT_TYPE"].find(
                (option) => option.code === activity.eventType
              ).name }} -
          </span> -->
            {{ activity.eventDescription }}
            <el-popconfirm
              title="确定要删除吗？"
              @confirm="deleteEvent(drawerItemId, activity.id)"
            >
              <template #reference>
                <el-button
                  :icon="Delete"
                  type="danger"
                  size="small"
                  circle
                  style="float: right"
                />
              </template>
            </el-popconfirm>
          </el-timeline-item>
        </el-timeline>

        <el-divider border-style="dashed" style="margin-top: 0" />
        <h4 style="margin: 0 0 30px 0">Add events</h4>
        <el-form :model="newTimeline" label-width="auto">
          <el-form-item prop="date" label="Event date">
            <el-date-picker
              v-model="newTimeline.date"
              type="date"
              placeholder="Select Date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

      

          <el-form-item label="Event type" prop="eventType">


            <el-select
                v-model="newTimeline.eventType"
              >
                <el-option
                  v-for="opt in dictOptions['EVENT_TYPE']"
                  :key="opt.code"
                  :label="opt.name"
                  :value="opt.code"
                />
              </el-select>
          </el-form-item>

              <el-form-item label="Event description" prop="eventDescription">
            <el-input v-model="newTimeline.eventDescription"></el-input>
          </el-form-item>


          <el-button type="primary" @click="addEvent(drawerItemId)"
            >Add</el-button
          >


        </el-form>

        <el-divider border-style="dashed" />
        <h4 style="margin: 0 0 30px 0">Sub items</h4>

        <el-table
          :data="subItemsData"
          :default-sort="{ prop: 'date', order: 'descending' }"
        >
          <el-table-column label="#">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column
            prop="name"
            label="Name"
            title="name"
            width="250"
          ></el-table-column>
          <el-table-column prop="price" label="Price"></el-table-column>
          <el-table-column
            prop="purchaseDate"
            label="Purchase Date"
          ></el-table-column>
          <el-table-column fixed="right" label="Operations" width="160">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="editItem(row)"
                >Edit</el-button
              >
              <el-popconfirm
                title="确定要删除吗？"
                @confirm="deleteItem(row.id)"
              >
                <template #reference>
                  <el-button link type="primary" size="small">Delete</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-button
          type="primary"
          @click="showAddDialog(true)"
          style="margin-top: 10px"
          >Add</el-button
        >

        <el-divider border-style="dashed" />
        <h4 style="margin: 0 0 30px 0">Custom fields</h4>

        <el-form ref="form" :model="customFieldForm" label-width="auto">
          <div v-for="field in enabledCustomFields" :key="field.id">
            <el-form-item :label="field.fieldName">
              <el-select
                v-if="field.fieldType == 'DATA_DICT'"
                v-model="customFieldForm[field.id]"
              >
                <el-option
                  v-for="opt in dictOptions[field.formula]"
                  :key="opt.code"
                  :label="opt.name"
                  :value="opt.code"
                />
              </el-select>

              <!-- <el-input
                v-else-if="field.fieldType == 'TEXT'"
                v-model="customFieldForm[field.id]"
              /> -->

              <el-autocomplete
               v-else-if="field.fieldType == 'TEXT'"
        v-model="customFieldForm[field.id]"
        :fetch-suggestions="querySearch.bind(null, field.id)"
        clearable
        placeholder="Please Input"
        @select="handleAutoCompleteSelect"/>


              <el-input
                v-else
                v-model="customFieldForm[field.id]"
                :disabled="field.fieldType == 'CODE'"
              ></el-input>
            </el-form-item>
          </div>
          <el-button type="primary" @click="saveCustomFields(drawerItemId)"
            >Save</el-button
          >
          <el-button type="primary" @click="customFieldsDialogVisible = true"
            >Add field</el-button
          >
        </el-form>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button type="primary" @click="drawer = false">Confirm</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="customFieldsDialogVisible" title="Custom fields">
      <el-table :data="customFields">
        <el-table-column property="id" label="ID" />
        <el-table-column property="fieldName" label="Name" />
        <el-table-column property="fieldType" label="Type">
          <template #default="{ row }">
            {{
              dictOptions["CUSTOM_FIELD_TYPE"].find(
                (option) => option.code === row.fieldType
              ).name
            }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="Operations">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="setCustomFieldEnabled(row.id, !row.enabled)"
              >{{ row.enabled ? "Disable" : "Enable" }}</el-button
            >

            <el-button
              link
              type="primary"
              size="small"
              @click="
                customFieldEditMode = true;
                addCustomFieldDialogVisible = true;
                newCustomFieldForm.id = row.id;
                newCustomFieldForm.fieldName = row.fieldName;
                newCustomFieldForm.fieldType = row.fieldType;
                newCustomFieldForm.formula = row.formula;
                newCustomFieldForm.enabled = row.enabled;
              "
              >Edit</el-button
            >
            <el-popconfirm
              title="确定要删除吗？"
              @confirm="deleteCustomField(row.id)"
            >
              <template #reference>
                <el-button link type="primary" size="small">Delete</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-button
        class="mt-4"
        style="width: 100%; margin-top: 10px"
        @click="
          customFieldEditMode = false;
          addCustomFieldDialogVisible = true;
          newCustomFieldForm.id = '';
          newCustomFieldForm.fieldName = '';
          newCustomFieldForm.fieldType = '';
          newCustomFieldForm.formula = '';
          newCustomFieldForm.enabled = true;
        "
      >
        Add Field
      </el-button>
    </el-dialog>

    <el-dialog
      v-model="addCustomFieldDialogVisible"
      :title="customFieldEditMode ? 'Edit custom field' : 'Add custom field'"
      width="500"
    >
      <el-form :model="newCustomFieldForm" label-width="auto">
        <el-form-item label="Field name">
          <el-input v-model="newCustomFieldForm.fieldName" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Field type">
          <el-select v-model="newCustomFieldForm.fieldType">
            <el-option
              v-for="opt in dictOptions['CUSTOM_FIELD_TYPE']"
              :key="opt.code"
              :label="opt.name"
              :value="opt.code"
            />
          </el-select>
        </el-form-item>
        <!-- 当字段类型为 Data_dict 时显示的下拉列表 -->
        <el-form-item
          v-if="newCustomFieldForm.fieldType === 'DATA_DICT'"
          label="Dictionary"
        >
          <el-select v-model="newCustomFieldForm.formula">
            <el-option
              v-for="opt in dictKeys"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </el-form-item>
        <!-- 当字段类型为 Code 时显示的文本域 -->
        <el-form-item
          v-if="newCustomFieldForm.fieldType === 'CODE'"
          label="Code"
        >
          <el-input
            v-model="newCustomFieldForm.formula"
            type="textarea"
            :rows="4"
            placeholder="Enter JavaScript code"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addCustomFieldDialogVisible = false"
            >Cancel</el-button
          >
          <el-button
            type="primary"
            @click="
              addCustomFieldDialogVisible = false;
              customFieldEditMode ? updateCustomField() : addCustomField();
            "
          >
            {{ customFieldEditMode ? "Update" : "Add" }}
          </el-button>
        </div>
      </template>
    </el-dialog>



  </div>
</template>

<script lang="ts" setup>
import type { DrawerProps } from "element-plus";
import { ref, onMounted, reactive, computed } from "vue";
import axios from "axios";
import { UploadFilled,Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const drawer = ref(false);
const direction = ref<DrawerProps["direction"]>("rtl");

var categoriesFilters = ref([]);
var itemStatusFilters = ref([]);
var customFields = ref([]);
var customFieldForm = ref({});

const enabledCustomFields = computed(() => {
  return customFields.value.filter((field) => field.enabled);
});

var drawerItemId = ref();

const search = ref("");
const filterTableData = computed(() =>
  items.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const subItemsData = ref([]);

const items = ref([]);
const dialogVisible = ref(false);

const customFieldsDialogVisible = ref(false);
const addCustomFieldDialogVisible = ref(false);

const customFilterPopoverVisible = ref(false);


const newItem = reactive({
  id: "",
  name: "",
  price: "",
  purchaseDate: "",
  remark: "",
  categoryId: "",
  status: "",
  attachmentId: "",
  attachmentName: "",
  parentId: null,
});

var timelineEvents = ref([
  {
    id: "",
    itemId: "",
    eventDescription: "",
    eventType: "",
    date: "",
  },
]);

var newCustomFieldForm = reactive({
  id: "",
  fieldName: "",
  fieldType: "",
  formula: "",
  enabled: "",
});

const newTimeline = reactive({
  itemId: "",
  eventDescription: "",
  eventType: "",
  date: "",
});

const editMode = ref(false);
const isSubItem = ref(false);

const customFieldEditMode = ref(false);

const fileList = ref([]); // 文件列表

const getCustomFields = async () => {
  try {
    const response = await axios.get("/api/custom_fields");
    customFields.value = response.data;
    console.log(customFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error fetching custom fields:" + error.message,
    });
  }
};

// const getEnabledCustomFields = async () => {
//   try {
//     const response = await axios.get("/api/custom_fields/enabled");
//     enabledCustomFields.value = response.data;
//     console.log(customFields);
//   } catch (error) {
//     console.error("Error fetching custom fields:", error);
//     ElMessage({
//       type: "error",
//       message: "Error fetching custom fields:" + error.message,
//     });
//   }
// };

const getCategories = async () => {
  try {
    const response = await axios.get("/api/categories");
    categoriesFilters.value = response.data.map((cat) => ({
      text: cat.name,
      value: cat.name,
      id: cat.id,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    ElMessage({
      type: "error",
      message: "Error fetching categories:" + error.message,
    });
  }
};

const getItems = async () => {
  try {
    const response = await axios.get("/api/items");
    items.value = response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
    ElMessage({
      type: "error",
      message: "Error fetching items:" + error,
    });
  }
};

const showAddDialog = (issub) => {
  fileList.value.length = 0;
  newItem.id = "";        
  newItem.name = "";
  newItem.price = "";
  newItem.purchaseDate = "";
  newItem.categoryId = "";
  newItem.status = "NORMAL";
  newItem.remark = "";
  newItem.attachmentId = "";
  newItem.attachmentName = "";
  editMode.value = false;
  dialogVisible.value = true;
  isSubItem.value = issub;
  if (issub) {
    newItem.parentId = drawerItemId;
  } else {
    newItem.parentId = null;
  }
};

const addItem = async () => {
  try {
    const response = await axios.post("/api/items", newItem);
    items.value.push(response.data);
    dialogVisible.value = false;
    ElMessage({
      type: "success",
      message: "添加成功",
    });
    getItems();
    // // 添加子物品完成后刷新子物品列表
    // if (drawerItemId) {
    //   getDetails(drawerItemId);
    // }
  } catch (error) {
    console.error("Error adding item:", error);
    ElMessage({
      type: "error",
      message: "Error adding item:" + error.message,
    });
  }
};

const editItem = (item) => {
  fileList.value.length = 0;
  newItem.name = item.name;
  newItem.id = item.id;
  newItem.price = item.price;
  newItem.purchaseDate = item.purchaseDate;
  newItem.remark = item.remark;
  newItem.categoryId = item.categoryId;
  newItem.status = item.status;
  newItem.attachmentId = item.attachmentId;
  newItem.parentId = item.parentId;
  if (item.attachment) {
    newItem.attachmentName = item.attachment.originalFileName;
  }

  editMode.value = true;
  isSubItem.value = false;
  dialogVisible.value = true;
};

const updateItem = async () => {
  try {
    await axios.put(`/api/items/${newItem.id}`, newItem);
    const index = items.value.findIndex((item) => item.id === newItem.id);
    if (index !== -1) {
      items.value.splice(index, 1, newItem);
    }

    dialogVisible.value = false;
    ElMessage({
      type: "success",
      message: "修改成功",
    });
    getItems();
  } catch (error) {
    console.error("Error updating item:", error);
    ElMessage({
      type: "error",
      message: "Error updating item:" + error.message,
    });
  }
};

const deleteItem = async (id) => {
  try {
    await axios.delete(`/api/items/${id}`);
    items.value = items.value.filter((item) => item.id !== id);
    ElMessage({
      type: "success",
      message: "删除成功",
    });
    getItems();
  } catch (error) {
    console.error("Error deleting item:", error);
    ElMessage({
      type: "error",
      message: "Error deleting item:" + error.message,
    });
  }
};

const categoryFilterHandler = (value, row, column) => {
  return row.category.name === value;
};

const itemStatusFilterHandler = (value, row, column) => {
  return row.status === value;
};

const handleUploadSuccess = (response, file, fileList) => {
  ElMessage({
    type: "success",
    message: "File uploaded successfully",
  });
  newItem.attachmentId = response.id;
  newItem.attachmentName = response.originalFileName;
};

const handleUploadError = (error, file, fileList) => {
  ElMessage({
    type: "error",
    message: "Failed to upload file: " + error.message, //JSON.parse(error.message).message,
  });
};

const handleUploadExceed = (files, uploadFiles) => {
  ElMessage.warning(`只能上传一个附件`);
};

const handleUploadFileRemove = (file, uploadFiles) => {};

const addEvent = async (itemId) => {
  try {
    newTimeline.itemId = itemId;
    const response = await axios.post("/api/timeline", newTimeline);
    ElMessage({
      type: "success",
      message: "Event added successfully",
    });
    getItems();
    getDetails(itemId);
  } catch (error) {
    console.error("Error adding event:", error);
    ElMessage({
      type: "error",
      message: "Error adding event:" + error.message,
    });
  }
};

const deleteEvent = async (itemId, eventId) => {
  try {
    await axios.delete(`/api/timeline/${eventId}`);
    ElMessage({
      type: "success",
      message: "Event deleted successfully",
    });
    getItems();
    getDetails(itemId);
  } catch (error) {
    console.error("Error deleting event:", error);
    ElMessage({
      type: "error",
      message: "Error deleting event:" + error.message,
    });
  }
};

const deleteAttachment = async (attachmentId) => {
  newItem.attachmentId = null;
  try {
    await axios.delete(`/api/attachments/${attachmentId}`);
    ElMessage({
      type: "success",
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    ElMessage({
      type: "error",
      message: "Error deleting attachment:" + error.response.data,
    });
  }
};

const getDetails = async (itemId) => {
  drawerItemId = itemId;

  try {
    const response = await axios.get("/api/timeline/item/" + itemId);
    timelineEvents.value = response.data;
  } catch (error) {
    console.error(
      "Error fetching timeline events for itemId=" + itemId + ": ",
      error
    );
    ElMessage({
      type: "error",
      message:
        "Error fetching timeline events for itemId=" +
        itemId +
        ": " +
        error.message,
    });
  } finally {
    newTimeline.date = "";
    newTimeline.eventDescription = "";
    newTimeline.eventType = "";
  }

  try {
    const response = await axios.get("/api/custom_fields/item/" + itemId);
    customFieldForm.value = response.data.reduce((acc, field) => {
      acc[field.customFieldId] = field.value; // 使用方括号来设置动态的属性名
      return acc;
    }, {});
  } catch (error) {
    console.error(
      "Error fetching custom fields for itemId=" + itemId + ": ",
      error
    );
    ElMessage({
      type: "error",
      message:
        "Error fetching custom fields for itemId=" +
        itemId +
        ": " +
        error.message,
    });
  } finally {
    newTimeline.date = "";
    newTimeline.eventDescription = "";
    newTimeline.eventType = "";
  }

  try {
    const response = await axios.get("/api/items/subItems/" + itemId);
    subItemsData.value = response.data;
  } catch (error) {
    console.error("Error fetching subItems for itemId=" + itemId + ": ", error);
    ElMessage({
      type: "error",
      message:
        "Error fetching subItems for itemId=" + itemId + ": " + error.message,
    });
  } finally {
    newTimeline.date = "";
    newTimeline.eventDescription = "";
    newTimeline.eventType = "";
  }
};

const dictOptions = reactive({}); // key为数据字典名称，value为数据字典选项列表
const dictKeys = computed(() => Object.keys(dictOptions)); // 数据字典名称列表

/**
 * 获取数据字典的选项（对象，key为数据字典名称，value为数据字典选项列表）
 */
const fetchDictOptions = async () => {
  try {
    const response = await axios.get("/api/dict_data");
    var data = response.data;

    // 遍历数据并将 items 列表按 dictCode 分类
    data.forEach((item) => {
      if (item.dictCode) {
        // 如果当前 dictCode 不存在，则初始化为一个空数组
        if (!dictOptions[item.dictCode]) {
          dictOptions[item.dictCode] = [];
        }
        // 将当前 item 添加到对应的 dictCode 列表中
        dictOptions[item.dictCode].push(item);
      }
    });

    // 物品状态筛选器
    itemStatusFilters.value = dictOptions["ITEM_STATUS"].map((status) => ({
      text: status.name,
      value: status.code,
      id: status.id,
    }));
  } catch (error) {
    console.error("Error fetching dict options:", error);
    ElMessage({
      type: "error",
      message: "Error fetching dict options: " + error.message,
    });
  }
};

/**
 * 保存物品自定义字段
 * @param itemId 物品id
 */
const saveCustomFields = async (itemId) => {
  try {
    const itemCustomFieldValues = Object.keys(customFieldForm.value).map(
      (customFieldId) => ({
        itemId: itemId,
        customFieldId: customFieldId,
        value: customFieldForm.value[customFieldId],
      })
    );

    const response = await axios.post(
      "/api/custom_fields/values",
      itemCustomFieldValues
    );

    ElMessage({
      type: "success",
      message: "Custom fields saved successfully",
    });
    getItems();

    //保存自定义字段后更新筛选器信息，方便下次补全
    getCustomFieldValues();
  } catch (error) {
    console.error("Error saving custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error saving custom fields:" + error.message,
    });
  }
};

/**
 * 添加自定义字段
 */
const addCustomField = async () => {
  try {
    const response = await axios.post("/api/custom_fields", newCustomFieldForm);

    ElMessage({
      type: "success",
      message: "Custom fields added successfully",
    });
    getItems();
    getCustomFields();
  } catch (error) {
    console.error("Error adding custom field:", error);
    ElMessage({
      type: "error",
      message: "Error adding custom field:" + error.message,
    });
  }
};

/**
 * 删除自定义字段
 * @param customFieldId 自定义字段id
 */
const deleteCustomField = async (customFieldId) => {
  try {
    await axios.delete(`/api/custom_fields/${customFieldId}`);
    ElMessage({
      type: "success",
      message: "Custom field deleted successfully",
    });
    getCustomFields();
  } catch (error) {
    console.error("Error deleting custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error deleting custom fields:" + error.message,
    });
  }
};

/**
 * 修改自定义字段
 */
const updateCustomField = async () => {
  try {
    await axios.put(
      `/api/custom_fields/${newCustomFieldForm.id}`,
      newCustomFieldForm
    );
    ElMessage({
      type: "success",
      message: "Custom field updated successfully",
    });
    getCustomFields();
  } catch (error) {
    console.error("Error updating custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error updating custom fields:" + error.message,
    });
  }
};

const setCustomFieldEnabled = async (id, enabled) => {
  try {
    await axios.put(`/api/custom_fields/${id}/enabled/${enabled}`);
    ElMessage({
      type: "success",
      message: "Custom field updated successfully",
    });
    getCustomFields();
  } catch (error) {
    console.error("Error updating custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error updating custom fields:" + error.message,
    });
  }
};

//添加分类 开始

const isAdding = ref(false);
const optionName = ref("");

const onAddOption = () => {
  isAdding.value = true;
};

/**
 * 添加分类
 */
const addCategory = async (categoryName) => {
  try {
    const response = await axios.post("/api/categories", {
      name: categoryName,
    });

    ElMessage({
      type: "success",
      message: "Category added successfully",
    });
    getCategories();
  } catch (error) {
    console.error("Error adding category:", error);
    ElMessage({
      type: "error",
      message: "Error adding category:" + error.message,
    });
  }
};
const onConfirm = () => {
  if (optionName.value) {
    addCategory(optionName.value);
    // cities.value.push({
    //   label: optionName.value,
    //   value: optionName.value,
    // })
    clear();
  }
};

const clear = () => {
  optionName.value = "";
  isAdding.value = false;
};

//添加分类 结束

// 自定义筛选器

const getCustomFieldValues = async () => {
  try {
    const response = await axios.get("/api/custom_fields/values");
    customFieldValues.value = response.data;
    console.log(customFieldValues);
  } catch (error) {
    console.error("Error fetching custom field values:", error);
    ElMessage({
      type: "error",
      message: "Error fetching custom fields values" + error.message,
    });
  }
};

var customFieldValues = ref({});

const getFieldNameById = (id) => {
  const field = customFields.value.find((field) => field.id === id);
  return field ? field.fieldName : String(id); // 如果找不到对应的 fieldName，则返回 id 的字符串形式
};


const formattedCustomFieldValues = computed(() => {
  return Object.keys(customFieldValues.value).map((key) => ({
    value: key,
    label: getFieldNameById(parseInt(key, 10)),
    children: customFieldValues.value[key].map((value) => ({
      value: value,
      label: value,
    })),
  }));
});

// el-cascader 组件的 v-model
const cascaderValue = ref([]);

// // el-cascader 组件的 props
// const props = {
//   expandTrigger: "hover" as const,
// };

// 选项改变时的处理函数
const handleChange = async (value) => {
  console.log("Selected value:", value);
  if (!value) {
    return;
  }
  try {
    const response = await axios.get("/api/custom_fields/items", {
      params: {
        fieldId: value[0],
        fieldValue: value[1],
      },
    });
    items.value = response.data;
  } catch (error) {
    console.error("Error fetching items by custom field value:", error);
    ElMessage({
      type: "error",
      message: "Error fetching items by custom field value:" + error,
    });
  }

  ElMessage({
    message: "已完成筛选：" + getFieldNameById(parseInt(value[0], 10)) + "=" + value[1],
  });
};

const handleCascaderClear = async () => {
  getItems();
}


// 自动补全

const querySearch = (fieldId, queryString: string, cb: any) => {
  const values= customFieldValues.value[fieldId];
  const results = values.filter(createFilter(queryString));
  const final = results.map(value => ({ value }));
  // call callback function to return suggestions
  cb(final)
}

const createFilter = (queryString: string) => {
  return (item) => {
    if (item==null)return;
    return (
      
      item.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

const handleAutoCompleteSelect = (item: Record<string, any>) => {
  console.log(item)
}


onMounted(() => {
  getItems();
  getCategories();
  getCustomFields();
  fetchDictOptions();
  getCustomFieldValues();
});


</script>

<style>
.option-input {
  width: 100%;
  margin-bottom: 8px;
}
</style>
