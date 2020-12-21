<script>
  import Rover from './Rover.svelte';
  import { gridDimensions, rovers } from '../logic/stores';

  import genGrid from '../logic/genGrid';

  $: grid = genGrid($gridDimensions.x, $gridDimensions.y, $rovers);
  $: {
    console.log('GRID', grid);
  }
</script>

<div class="p-4 grid-wrapper">
  {#each grid as RowItem, row}
    <div class="clear-both">
      {#each grid[row] as ColItem, col}
        <div class="float-left whitespace-no-wrap">
          <div class="relative">
            <img src="{ColItem.url}" alt="tile" />
            {#if ColItem.rover}
              <Rover title="{ColItem.rover.name}" />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>
