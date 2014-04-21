#!/bin/bash

# load
for bcnt in 1000 50000; do
    for zcnt in 0 100 500; do
        for qcnt in 0; do
            echo -------- z:$zcnt b:$bcnt q:$qcnt --------
            ./timeSeriesTest.sh -stat -bsiz 1000 -bcnt ${bcnt} -qcnt ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt} | tee load-ts-z${zcnt}-b${bcnt}-q-${qcnt}.log
        done
    done
done


# query
for bcnt in 1000 50000; do
    for zcnt in 0 100 250 500; do
        for qcnt in 1 5 10; do
            echo -------- z:$zcnt b:$bcnt q:$qcnt --------
            ./timeSeriesTest.sh -noload -stat -bsiz 1000 -bcnt ${bcnt} -qcnt ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt} | tee query-ts-z${zcnt}-b${bcnt}-q-${qcnt}.log
        done
    done
done

