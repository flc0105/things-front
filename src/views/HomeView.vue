<template>
  <div>
    <!-- 按钮 -->
    <el-button type="primary" @click="showAddDialog">Add Item</el-button>
    <el-button @click="getItems">Refresh</el-button>

    <!-- 表格 -->
    <el-table
      :data="filterTableData"
      style="width: 100%"
      :default-sort="{ prop: 'date', order: 'descending' }"
      show-summary
    >
      <el-table-column label="#">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <!-- <el-table-column prop="name" label="Name" title="name"></el-table-column> -->

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
            <!-- <template #default>
            <div>{{ scope.row.name }}</div>
          </template> -->
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
                  {{ activity.event }}
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

      <el-table-column prop="averageDailyPrice" label="Average Daily Price">
        <template #default="scope">
          <el-text
            :style="{ color: scope.row.status === 'SOLD' ? 'gray' : '' }"
          >
            {{ scope.row.averageDailyPrice }}
          </el-text>
        </template>
      </el-table-column>

      <!-- 新添加的列，显示标签 -->
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
                  :href="
                    '/api/attachments/' + newItem.attachmentId + '/download'
                  "
                >
                  <!-- {{ "Selected file:" + newItem.attachmentId }} -->
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

    <!-- 时间轴抽屉 -->
    <el-drawer v-model="drawer" :direction="direction" title="Details">
      <template #default>
        <h4 style="margin: 0 0 30px 0">Timeline events</h4>

        <el-empty v-if="timelineEvents.length == 0" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="(activity, index) in timelineEvents"
            :key="index"
            :timestamp="activity.date"
          >
            {{ activity.event }}
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

          <el-form-item label="Event name" prop="event">
            <el-input v-model="newTimeline.event"></el-input>
          </el-form-item>
          <el-button type="primary" @click="addEvent(drawerItemId)"
            >Add</el-button
          >
        </el-form>

        <el-divider border-style="dashed" />
        <h4 style="margin: 0 0 30px 0">Custom fields</h4>

        <el-empty v-if="customFields.length == 0" />
        <el-form v-else ref="form" :model="customFieldForm" label-width="auto">
          <div v-for="field in customFields" :key="field.id">
            <el-form-item :label="field.fieldName">
              <el-input v-model="customFieldForm[field.id]"></el-input>
            </el-form-item>
          </div>
          <el-button type="primary" @click="saveCustomFields(drawerItemId)"
            >Save</el-button
          >
        </el-form>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button type="primary" @click="drawer = false">Confirm</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import type { DrawerProps } from "element-plus";
import { ref, onMounted, reactive, computed } from "vue";
import axios from "axios";

import { UploadFilled } from "@element-plus/icons-vue";
import { Delete } from "@element-plus/icons-vue";

import { ElMessage } from "element-plus";

const drawer = ref(false);
const direction = ref<DrawerProps["direction"]>("rtl");

var categoriesFilters = ref([]);
var itemStatusFilters = ref([]);
var customFields = ref([]);
var customFieldForm = ref({});
var drawerItemId = ref();

const search = ref("");
const filterTableData = computed(() =>
  items.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const items = ref([]);
const dialogVisible = ref(false);
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
});

var timelineEvents = ref([
  {
    id: "",
    itemId: "",
    event: "",
    date: "",
  },
]);

const newTimeline = reactive({
  itemId: "",
  event: "",
  date: "",
});

const editMode = ref(false);

const fileList = ref([]); // 文件列表

const getItemStatus = async () => {
  try {
    const response = await axios.get(
      "/api/dict_data/getByDictCode?dictCode=ITEM_STATUS"
    );
    itemStatusFilters.value = response.data.map((status) => ({
      text: status.name,
      value: status.code,
      id: status.id,
    }));
  } catch (error) {
    console.error("Error fetching item status:", error);
    ElMessage({
      type: "error",
      message: "Error fetching item status:" + error.message,
    });
  }
};

const getCustomFields = async () => {
  try {
    const response = await axios.get("/api/custom_fields");
    customFields.value = response.data;
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error fetching custom fields:" + error.message,
    });
  }
};

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

const showAddDialog = () => {
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
};

const addItem = async () => {
  try {
    const response = await axios.post("/api/items", newItem);
    items.value.push(response.data);
    dialogVisible.value = false;
    // this.$refs.newItemForm.resetFields(); // Reset form fields after adding
    ElMessage({
      type: "success",
      message: "添加成功",
    });
    getItems();
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
  if (item.attachment) {
    newItem.attachmentName = item.attachment.originalFileName;
  }

  editMode.value = true;
  dialogVisible.value = true;
};

onMounted(() => {
  getItems();
  getCategories();
  getItemStatus();
  getCustomFields();
  // getTotalValue();
});

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
  // if (response.success) {
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

const handleUploadFileRemove = (file, uploadFiles) => {
  // newItem.attachmentId = null;
};

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
    console.error("Error deleting attachment:", error);
    ElMessage({
      type: "error",
      message: "Error deleting attachment:" + error.message,
    });
  }
};

const getDetails = async (itemId) => {
  drawerItemId = itemId;
  try {
    const response = await axios.get("/api/items/timeline/" + itemId);
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
    newTimeline.event = "";
  }

  try {
    const response = await axios.get("/api/items/customFields/" + itemId);
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
    newTimeline.event = "";
  }
};

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
      "/api/items/customFields/",
      itemCustomFieldValues
    );

    ElMessage({
      type: "success",
      message: "Custom fields saved successfully",
    });
    getItems();
  } catch (error) {
    console.error("Error saving custom fields:", error);
    ElMessage({
      type: "error",
      message: "Error saving custom fields:" + error.message,
    });
  }
};
</script>
