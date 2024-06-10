<template>
  <li>姓名：{{ getUserState.name }}</li>
  <li>年龄：{{ getUserState.age }}</li>
  <li>地址：{{ getUserState.address }}</li>
  <el-button
    plain
    @click="open1"
  >
    Closes automatically
  </el-button>
  <el-button
    plain
    @click="open2"
  >
    Won't close automatically
  </el-button>
  <el-form
    ref="formRef"
    style="max-width: 600px"
    :model="numberValidateForm"
    label-width="auto"
    class="demo-ruleForm"
  >
    <el-form-item
      label="age"
      prop="age"
      :rules="[
        { required: true, message: 'age is required' },
        { type: 'number', message: 'age must be a number' }
      ]"
    >
      <el-input
        v-model.number="numberValidateForm.age"
        type="text"
        autocomplete="off"
      />
    </el-form-item>
    <el-form-item>
      <el-button
        type="primary"
        @click="submitForm(formRef)"
        >Submit</el-button
      >
      <el-button @click="resetForm(formRef)">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { useUserGetters, useUserActions } from '@/stores/index.ts';

const { getUserState } = useUserGetters(); // 获取最新 userState
const { setUserState } = useUserActions(); // 获取设置方法

function setUser() {
  setTimeout(() => {
    setUserState({
      name: '章三',
      age: 19,
      address: '中国'
    });
  }, 1000);
}
setUser();

const formRef = ref<FormInstance>();

const numberValidateForm = reactive({
  age: ''
});

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(() => {});
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const open1 = () => {
  ElNotification({
    title: 'Title',
    message: h('i', { style: 'color: teal' }, 'This is a reminder')
  });
};

const open2 = () => {
  ElNotification({
    title: 'Prompt',
    message: 'This is a message that does not automatically close',
    duration: 0
  });
};
</script>
