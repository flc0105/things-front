<template>
  <div>
    <el-button type="primary" @click="showAddDialog">Add Item</el-button>
    <el-button @click="getItems">Refresh</el-button>
    <el-table :data="items" style="width: 100%" :default-sort="{ prop: 'date', order: 'descending' }">
      <el-table-column label="#">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>


      <!-- <el-table-column prop="name" label="Name" title="name"></el-table-column> -->

      <el-table-column prop="name" label="Name" title="name" sortable>
      <template #default="scope">
        <el-popover effect="light" trigger="hover" placement="top" width="auto" :title="scope.row.name" :content="scope.row.remark" v-if="scope.row.remark!=null&&scope.row.remark!=''">
          <!-- <template #default>
            <div>{{ scope.row.name }}</div>
          </template> -->
          <template #reference>
            {{scope.row.name}}
          </template>
        </el-popover>
      </template>
    </el-table-column>


      <el-table-column prop="price" label="Price" sortable></el-table-column>
      <el-table-column
        prop="purchaseDate"
        label="Purchase Date" sortable
      ></el-table-column>
      <el-table-column
        prop="ownershipDuration"
        label="Ownership Duration"
      ></el-table-column>

             <!-- 新添加的列，显示标签 -->
    <el-table-column label="Category"    :filters="categoriesFilters" :filter-method="filterHandler"
    >
      <template #default="{ row }">
        <el-tag style="margin-right: 5px;" v-if="row.category">{{ row.category.name }}</el-tag>
      </template>
    </el-table-column>


    <el-table-column label="Status" >
      <template #default="{ row }">
        <el-tag style="margin-right: 5px;" v-if="row.statusStr">{{ row.statusStr }}</el-tag>
      </template>
    </el-table-column>

      <el-table-column fixed="right" label="Operations" width="120">
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

    <el-text>
      
      Total value: {{ totalValue }}


    </el-text>

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
        <el-select v-model="newItem.categoryId"  filterable   clearable  default-first-option :reserve-keyword="false">
            <el-option v-for="cat in categoriesFilters" :key="cat.id" :label="cat.text" :value="cat.id"></el-option>
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
import { ref, onMounted, reactive } from "vue";
import axios from "axios";

const totalValue = ref(0);
var categoriesFilters = ref([]);

const items = ref([]);
const dialogVisible = ref(false);
const newItem = reactive({
  id: "",
  name: "",
  price: "",
  purchaseDate: "",
  remark: "",
  categoryId: ""
});

const editMode = ref(false);


const getCategories = async () => {
  try {
    const response = await axios.get("/api/categories");
    categoriesFilters.value = response.data.map(cat => ({ text: cat.name, value: cat.name, id: cat.id }));

  } catch (error) {
    console.error("Error fetching categories:", error);
  }
};

const getItems = async () => {
  try {
    const response = await axios.get("/api/items");
    items.value = response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
  }
};

const getTotalValue = async () => {
  try {
    const response = await axios.get("/api/items/total-value");
    totalValue.value = response.data;
  } catch (error) {
    console.error("Error fetching items total value:", error);
  }
};

const showAddDialog = () => {
  newItem.id = "";
  newItem.name = "";
  newItem.price = "";
  newItem.purchaseDate = "";
  newItem.categoryId = "";
  newItem.remark = "";
  editMode.value = false;
  dialogVisible.value = true;
};

const addItem = async () => {
  try {
    const response = await axios.post("/api/items", newItem);
    items.value.push(response.data);
    dialogVisible.value = false;
    this.$refs.newItemForm.resetFields(); // Reset form fields after adding
  } catch (error) {
    console.error("Error adding item:", error);
  }
};

const editItem = (item) => {
  newItem.name = item.name;
  newItem.id = item.id;
  newItem.price = item.price;
  newItem.purchaseDate = item.purchaseDate;
  newItem.remark = item.remark;
  newItem.categoryId = item.categoryId;

  editMode.value = true;

  dialogVisible.value = true;
};

onMounted(() => {
  getItems();
  getCategories();
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
  } catch (error) {
    console.error("Error updating item:", error);
  }
};

const deleteItem = async (id) => {
  try {
    await axios.delete(`/api/items/${id}`);
    items.value = items.value.filter((item) => item.id !== id);
  } catch (error) {
    console.error("Error deleting item:", error);
  }
};

const filterHandler = (
  value,
  row,
  column
) => {
  // if (row.category)
  return row.category.name === value;
}
</script>

<style>
/* Add your custom styles here */
</style>
