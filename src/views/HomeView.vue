<template>
  <div>
    <el-button type="primary" @click="showAddDialog">Add Item</el-button>
    <el-button @click="getItems">Refresh</el-button>
    <el-table
      :data="filterTableData"
      style="width: 100%"
      :default-sort="{ prop: 'date', order: 'descending' }"
    >
      <el-table-column label="#">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <!-- <el-table-column prop="name" label="Name" title="name"></el-table-column> -->

      <el-table-column prop="name" label="Name" title="name" sortable>
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

      <el-table-column fixed="right" label="Operations" width="120">
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
        </template>
      </el-table-column>
    </el-table>

    <el-text> Total value: {{ totalValue }} </el-text>

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
                <!-- {{ "Selected file:" + newItem.attachment.originalFileName }}    -->
                <el-link
                  style="font-size: 12px"
                  v-if="newItem.attachmentId"
                  :underline="false"
                  type="primary"
                  :href="
                    '/api/attachments/' + newItem.attachmentId + '/download'
                  "
                  >{{ "Selected file:" + newItem.attachmentId }}</el-link
                >
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

      <!-- <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="addItem">Add</el-button>
      </div> -->
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import axios from "axios";

import { UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const totalValue = ref(0);
var categoriesFilters = ref([]);
var itemStatusFilters = ref([]);

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

const getTotalValue = async () => {
  try {
    const response = await axios.get("/api/items/total-value");
    totalValue.value = response.data;
  } catch (error) {
    console.error("Error fetching items total value:", error);
    ElMessage({
      type: "error",
      message: "Error fetching items total value:" + error.message,
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
  editMode.value = false;
  dialogVisible.value = true;
};

const addItem = async () => {
  try {
    const response = await axios.post("/api/items", newItem);
    items.value.push(response.data);
    dialogVisible.value = false;
    this.$refs.newItemForm.resetFields(); // Reset form fields after adding
    ElMessage({
      type: "success",
      message: "添加成功",
    });
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
  editMode.value = true;
  dialogVisible.value = true;
};

onMounted(() => {
  getItems();
  getCategories();
  getItemStatus();
  getTotalValue();
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
    message: "文件上传成功，文件ID：" + response.id,
  });
  newItem.attachmentId = response.id;
};

const handleUploadError = (error, file, fileList) => {
  ElMessage({
    type: "error",
    message: "文件上传失败：" + error.message, //JSON.parse(error.message).message,
  });
};

const handleUploadExceed = (files, uploadFiles) => {
  ElMessage.warning(`只能上传一个附件`);
};

const handleUploadFileRemove = (file, uploadFiles) => {
  newItem.attachmentId = null;
};
</script>
