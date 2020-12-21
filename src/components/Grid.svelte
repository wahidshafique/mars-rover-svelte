<script>
  import { gridDimensions } from '../logic/stores';
  import genGrid from '../logic/genGrid';
  let grid = genGrid($gridDimensions.height, $gridDimensions.width);
</script>

<div class="p-4">
  {#each grid[0] as RowItem, row}
    <div class="table clear-both">
      {#each grid[1] as ColItem, col}
        <img class="float-left" src="{ColItem.url}" alt="tile" />
      {/each}
    </div>
  {/each}
</div>
