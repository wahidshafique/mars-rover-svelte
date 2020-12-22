<script>
  import Rover from './Rover.svelte';
  import { gridDimensions, rovers } from '../logic/stores';

  import genGrid from '../logic/genGrid';

  $: grid = genGrid($gridDimensions.x, $gridDimensions.y, $rovers);
</script>

<div class="p-4 grid-wrapper">
  {#each grid as _, col}
    <div class="clear-both">
      {#each grid[col] as Item, row}
        <div class="float-left whitespace-no-wrap">
          <div class="relative">
            <img src="{Item.url}" alt="{`tile-${row}-${col}`}" />
            {#if Item.rover}
              <Rover title="{Item.rover.name}" />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>
