<template>
  <div class="slidev-layout cover p-0">
    <div class="flex justify-between flex-col">
      <div class="p-10 px-12 relative h-full">
        <slot />
        <div class="absolute bottom-0 left-12 w-20 h-2 bg-[var(--color-blaze-a10)]"></div>
      </div>
      <div class="flex flex-col gap-2 border-t border-[var(--color-gray-a4)] bg-[var(--color-gray-2)] p-10 px-12">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
